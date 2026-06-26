// TODO: Confirm with DarajaAPI3.0 documentation how to initiate STK push in SpringBoot.
package ke.co.scentcepts.payment;

import com.fasterxml.jackson.databind.JsonNode;
import ke.co.scentcepts.common.events.OrderCreatedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

// TODO: generate the keys for safaricom
// class PaymentEventListener: will now generate the mpesa stk push when an order is created

@Component
public class PaymentEventListener {

    @Value("${safaricom.daraja.consumer-key}")
    private String consumerKey;

    @Value("${safaricom.daraja.consumer-secret}")
    private String consumerSecret;

    @Value("${safaricom.daraja.passkey}")
    private String passkey;

    @Value("${safaricom.daraja.shortcode}")
    private String shortcode;

    @Value("${safaricom.daraja.callback-url}")
    private String callbackUrl;

    private final RestTemplate restTemplate;
    private final PaymentTransactionRepository transactionRepository;

    // PaymentEventListener constructor that initializes -
    // PaymentTransactionRepository dependancy.
    public PaymentEventListener(PaymentTransactionRepository transactionRepository) {
        this.restTemplate = new RestTemplate();
        this.transactionRepository = transactionRepository;
    }

    @Async
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("Payment Module: Initiating Safaricom Daraja STK Push to phone: " + event.phone());

        try {
            // 1. Get the OAuth Token
            String token = getDarajaAccessToken();

            // 2. Prepare cryptographic timestamp and password
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String password = Base64.getEncoder().encodeToString(
                    (shortcode + passkey + timestamp).getBytes(StandardCharsets.UTF_8));

            // 3. Build the STK Push Payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("BusinessShortCode", shortcode);
            payload.put("Password", password);
            payload.put("Timestamp", timestamp);
            payload.put("TransactionType", "CustomerPayBillOnline");
            payload.put("Amount", event.amount().intValue()); // Safaricom expects integers
            payload.put("PartyA", event.phone());
            payload.put("PartyB", shortcode);
            payload.put("PhoneNumber", event.phone());
            payload.put("CallBackURL", callbackUrl);
            payload.put("AccountReference", event.orderId()); // We use the Order ID as the reference
            payload.put("TransactionDesc", "Scentcepts Order Payment");

            // 4. Set Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // 5. Fire the Request
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                    request,
                    JsonNode.class);

            JsonNode responseBody = response.getBody();
            if (responseBody != null && responseBody.has("CheckoutRequestID")) {

                // Makes the CheckoutRequestID as a String value - checkoutRequestId.
                // Creates a new PaymentTransaction entity to store the CheckoutRequestID and
                // other relevant information in the payment_transactions table.
                // This is the tracking ID that will be used to track the payment status.
                String checkoutRequestId = responseBody.get("CheckoutRequestID").asText();

                // CRITICAL FIX: Save the Safaricom tracking ID alongside the Order context
                PaymentTransaction transaction = new PaymentTransaction(
                        checkoutRequestId,
                        event.orderId(),
                        event.perfumeId(),
                        event.quantity());
                transactionRepository.save(transaction);

                System.out.println("STK Push triggered. Tracking ID saved: " + checkoutRequestId);
            }

            System.out.println("STK Push Response: " + response.getBody());
            // Note: We don't complete the order here. We wait for the asynchronous
            // callback.

        } catch (Exception e) {
            System.err.println("Failed to trigger STK Push: " + e.getMessage());
        }
    }

    // Helper method to fetch the short-lived OAuth token
    private String getDarajaAccessToken() {
        String credentials = consumerKey + ":" + consumerSecret;
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(encodedCredentials);

        HttpEntity<String> request = new HttpEntity<>(headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
                HttpMethod.GET,
                request,
                JsonNode.class);

        return response.getBody().get("access_token").asText();
    }
}