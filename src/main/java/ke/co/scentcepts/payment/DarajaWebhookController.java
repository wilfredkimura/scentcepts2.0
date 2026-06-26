// TODO:Read DarajaAPI docs specifically for callback url webhooks
// TODO: And how metadata is sent from Safaricom. To ensure we can map to our DB correctly.
// TODO: Read how to send STK push with metadata in Java
// TODO: And how to send data to a local database

package ke.co.scentcepts.payment;

import com.fasterxml.jackson.databind.JsonNode;
import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // HTTP rest endpoints
@RequestMapping("/api/payments") // Base url to our rest endpoints
public class DarajaWebhookController {
    // Inject ApplicationEventPublisher(datatype) to publish events
    private final ApplicationEventPublisher eventPublisher;

    // Constructor injection for ApplicationEventPublisher
    public DarajaWebhookController(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    // Mpesa Callback URL endpoint to receive webhook notifications from Safaricom
    @PostMapping("/callback") // Maps POST requests to the /api/payments/callback URL path
    public ResponseEntity<String> mpesaCallback(@RequestBody JsonNode payload) {
        System.out.println("Payment Module: Webhook payload received from Safaricom.");

        try {
            // Traverse Safaricom's nested JSON structure
            JsonNode stkCallback = payload.path("Body").path("stkCallback");
            int resultCode = stkCallback.path("ResultCode").asInt();
            String resultDesc = stkCallback.path("ResultDesc").asText();

            if (resultCode == 0) {
                // ResultCode 0 means the customer entered their PIN and had sufficient funds
                JsonNode metadataItems = stkCallback.path("CallbackMetadata").path("Item");

                String mpesaReceipt = "";
                double amountPaid = 0.0;

                // Safaricom sends metadata as an array of key-value pairs, so we must iterate
                for (JsonNode item : metadataItems) {
                    String name = item.path("Name").asText();
                    if ("MpesaReceiptNumber".equals(name)) {
                        mpesaReceipt = item.path("Value").asText();
                    } else if ("Amount".equals(name)) {
                        amountPaid = item.path("Value").asDouble();
                    }
                }

                System.out.println("Payment Successful! Receipt: " + mpesaReceipt + " Amount: " + amountPaid);

                // Note: In a production environment, you would query your PaymentTransaction
                // table
                // using the CheckoutRequestID to retrieve the exact OrderID and PerfumeID
                // context.
                // For this architecture, we dispatch the event with the extracted data.

                String orderId = "mapped-from-db"; // Mock mapping for architecture consistency
                Long perfumeId = 1L; // Mock mapping
                Integer quantity = 1;

                eventPublisher.publishEvent(new PaymentCompletedEvent(orderId, perfumeId, quantity, mpesaReceipt));

            } else {
                // ResultCode is non-zero (e.g., user canceled, timed out, or insufficient
                // funds)
                System.out.println("Payment Failed or Canceled. Reason: " + resultDesc);
                // You could publish a PaymentFailedEvent here to update the Order status to
                // FAILED.
            }

            // Always return 200 OK so Safaricom knows we received the webhook
            return ResponseEntity.ok("Acknowledged");

        } catch (Exception e) {
            System.err.println("Error parsing Daraja Webhook: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error Processing Payload");
        }
    }
}