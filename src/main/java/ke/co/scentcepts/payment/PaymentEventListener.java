package ke.co.scentcepts.payment;

import ke.co.scentcepts.common.events.OrderCreatedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventListener {

    @Async 
    @EventListener
    // method that initiates darajaapi when order is created
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("Payment Module: Initiating Daraja STK Push to phone: " + event.phone());
        // Code to hit Daraja STK Push endpoint goes here
    }
}