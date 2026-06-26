package ke.co.scentcepts.catalog;

import ke.co.scentcepts.common.events.PaymentCompletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component // Component annotation marks this class as a Spring-managed bean
public class CatalogEventListener {

    private final PerfumeRepository perfumeRepository; // dependency injection of PerfumeRepository

    // CatalogEventListener constructor
    // Constructor injection of PerfumeRepository
    public CatalogEventListener(PerfumeRepository perfumeRepository) {
        this.perfumeRepository = perfumeRepository;
    }

    @Async // Async annotation makes this method run in a separate thread
    @EventListener // EventListener annotation marks this method as an event listener
    @Transactional // Required to maintain the database lock during the execution block
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        System.out.println("Catalog Module:     Attempting safe stock reduction for Perfume ID: " + event.perfumeId());

        // 1. Fetch the record and lock the row in PostgreSQL
        perfumeRepository.findByIdForUpdate(event.perfumeId()).ifPresentOrElse(perfume -> {

            // 2. Verify we actually have enough stock to fulfill the order
            // getters (getStockCount) and setters (setStockCount) are used to access and
            // modify the stockCount field of the perfume object
            if (perfume.getStockCount() >= event.quantity()) { // if stock count is greater than or equal to the
                                                               // quantity to be sold
                perfume.setStockCount(perfume.getStockCount() - event.quantity()); // reduce stock count
                perfumeRepository.save(perfume); // save the updated stock count
                System.out.println(
                        "Catalog Module: Stock safely reduced. Remaining stock count is: " + perfume.getStockCount()); // print
                                                                                                                       // the
                                                                                                                       // updated
                                                                                                                       // stock
                                                                                                                       // count
            } else {
                // TODO: In a production system, you would trigger an alert or an automatic
                // M-Pesa refund process here
                System.err.println("CRITICAL: Payment cleared but item is out of stock! Needs manual review.");
            }

        }, () -> {
            System.err.println("Catalog Module Error: Perfume ID " + event.perfumeId() + " not found.");
        });

        // 3. The transaction commits here, and the row lock is released for other
        // threads
    }
}