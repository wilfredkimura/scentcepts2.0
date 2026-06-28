package ke.co.scentcepts.order;

import ke.co.scentcepts.common.events.OrderCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service

// Initialized OrderServiceImplentation Class
public class OrderServiceImpl {

    // final non-access modifiers restrict modification of orderRepository and eventPublisher.
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    // OrderService Constructor
    public OrderServiceImpl(OrderRepository orderRepository, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * checkout processes the purchase request, saves the pending order details to the database,
     * and publishes an OrderCreatedEvent asynchronously to trigger STK Push payment prompts.
     *
     * @param request the order details sent by the controller (including resolved userId)
     * @return the unique order ID string
     */
    @Transactional
    public String checkout(Order request) {
        // Generate a cryptographically secure random UUID to identify this checkout transaction
        String orderId = UUID.randomUUID().toString(); 
        
        // Instantiate the Order entity, providing the generated transaction ID and user ID mapping
        Order order = new Order(
                orderId, 
                request.getPhone(), 
                request.getAmount(), 
                request.getPerfumeId(), 
                request.getQuantity(), 
                request.getUserId()
        );
        orderRepository.save(order); // Save the PENDING order in PostgreSQL

        // Instantiate and publish the OrderCreatedEvent on the Spring Application Event Bus
        OrderCreatedEvent event = new OrderCreatedEvent(
                orderId, 
                order.getPhone(), 
                order.getAmount(), 
                order.getPerfumeId(), 
                order.getQuantity(), 
                order.getUserId()
        );
        eventPublisher.publishEvent(event); // Triggers downstream payment listeners

        return orderId;
    }
}