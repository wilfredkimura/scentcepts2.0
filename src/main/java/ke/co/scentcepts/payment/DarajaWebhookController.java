// TODO:Read DarajaAPI docs specifically for callback url webhooks
// TODO: And how metadata is sent from Safaricom. To ensure we can map to our DB correctly.
// TODO: Read how to send STK push with metadata in Java
// TODO: And how to send data to a local database

package ke.co.scentcepts.payment;

import tools.jackson.databind.JsonNode;
import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController // HTTP rest endpoints
@RequestMapping("/api/payments") // Base url to our rest endpoints
public class DarajaWebhookController {
    
    // ApplicationEventPublisher handles dispatching PaymentCompletedEvent locally
    private final ApplicationEventPublisher eventPublisher;
    
    // PaymentTransactionRepository is used to look up transaction details using Safaricom's CheckoutRequestID
    private final PaymentTransactionRepository transactionRepository;

    // Constructor injecting both the event publisher and the transaction repository
    public DarajaWebhookController(ApplicationEventPublisher eventPublisher, PaymentTransactionRepository transactionRepository) {
        this.eventPublisher = eventPublisher;
        this.transactionRepository = transactionRepository;
    }

    // Mpesa Callback URL endpoint to receive webhook notifications from Safaricom
    @PostMapping("/callback") // Maps POST requests to the /api/payments/callback URL path
    public ResponseEntity<String> mpesaCallback(@RequestBody JsonNode payload) {
        System.out.println("Payment Module: Webhook payload received from Safaricom.");

        try {
            // 1. Traverse Safaricom's nested JSON structure to retrieve result parameters
            JsonNode stkCallback = payload.path("Body").path("stkCallback");
            int resultCode = stkCallback.path("ResultCode").asInt();
            String resultDesc = stkCallback.path("ResultDesc").asText();
            String checkoutRequestId = stkCallback.path("CheckoutRequestID").asText(); // Unique tracking ID returned by Safaricom

            // 2. Fetch the corresponding transaction mapping record from the local database using the tracking ID
            Optional<PaymentTransaction> transactionOpt = transactionRepository.findByCheckoutRequestId(checkoutRequestId);

            if (resultCode == 0) {
                // ResultCode 0 means the customer entered their PIN and the transaction succeeded
                JsonNode metadataItems = stkCallback.path("CallbackMetadata").path("Item");

                String mpesaReceipt = "";
                double amountPaid = 0.0;

                // Safaricom sends metadata (e.g., receipt number, amount) as an array of name/value pairs
                for (JsonNode item : metadataItems) {
                    String name = item.path("Name").asText();
                    if ("MpesaReceiptNumber".equals(name)) {
                        mpesaReceipt = item.path("Value").asText();
                    } else if ("Amount".equals(name)) {
                        amountPaid = item.path("Value").asDouble();
                    }
                }

                System.out.println("M-Pesa Callback: Payment Success! Receipt: " + mpesaReceipt + " Amount: " + amountPaid);

                // Update the payment transaction to COMPLETED and dispatch the local event to finalize the order
                if (transactionOpt.isPresent()) {
                    PaymentTransaction transaction = transactionOpt.get();
                    transaction.setStatus("COMPLETED");
                    transactionRepository.save(transaction); // Persist status update

                    // Fire internal event to trigger stock reduction and change order status to COMPLETED
                    eventPublisher.publishEvent(new PaymentCompletedEvent(
                            transaction.getOrderId(),
                            transaction.getPerfumeId(),
                            transaction.getQuantity(),
                            mpesaReceipt
                    ));
                    System.out.println("M-Pesa Callback: Updated transaction log and published PaymentCompletedEvent for Order ID: " + transaction.getOrderId());
                } else {
                    System.err.println("M-Pesa Callback Error: No transaction record found for CheckoutRequestID: " + checkoutRequestId);
                }

            } else {
                // ResultCode is non-zero, meaning the payment failed or was cancelled by the user
                System.out.println("M-Pesa Callback: Payment Failed or Canceled. Reason: " + resultDesc);

                // Update the transaction status to FAILED in the local database for auditing
                if (transactionOpt.isPresent()) {
                    PaymentTransaction transaction = transactionOpt.get();
                    transaction.setStatus("FAILED");
                    transactionRepository.save(transaction);
                    System.out.println("M-Pesa Callback: Transaction ID " + checkoutRequestId + " status set to FAILED.");
                } else {
                    System.err.println("M-Pesa Callback Error: No transaction record found for failed CheckoutRequestID: " + checkoutRequestId);
                }
            }

            // Always return 200 OK so Safaricom knows we received the webhook
            return ResponseEntity.ok("Acknowledged");

        } catch (Exception e) {
            System.err.println("Error parsing Daraja Webhook: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error Processing Payload");
        }
    }
}