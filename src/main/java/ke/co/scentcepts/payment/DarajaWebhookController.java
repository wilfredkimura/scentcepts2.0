package ke.co.scentcepts.payment;

import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class DarajaWebhookController {
    // Inject ApplicationEventPublisher(datatype) to publish events
    private final ApplicationEventPublisher eventPublisher;

    // Constructor injection for ApplicationEventPublisher
    public DarajaWebhookController(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    // Mpesa Callback URL endpoint to receive webhook notifications from Safaricom
    @PostMapping("/callback")
    public void mpesaCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("Payment Module: Webhook payload received from Safaricom.");
        
        // In reality, you parse 'payload' here to verify success
        // This is boilerplate code to simulate extracting relevant data from the callback payload
        String orderId = "extracted-from-callback-context"; 
        Long perfumeId = 1L;
        Integer quantity = 2;
        String mpesaReceipt = "M_PESA_REC_XYZ123";

        // Dispatch completion event globally across the monolith memory space
        // Pulishes the new PaymentCompletedEvent to the Spring application context
        eventPublisher.publishEvent(new PaymentCompletedEvent(orderId, perfumeId, quantity, mpesaReceipt));
    }
}