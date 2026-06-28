package ke.co.scentcepts.order;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * OrderController exposes REST endpoints for initiating perfume purchases.
 * It coordinates with OrderServiceImpl to create orders and publish checkout events.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Injection of the service layer to handle the checkout process and DB persistence
    private final OrderServiceImpl orderService;
    
    // Injection of OrderRepository to fetch order status details
    private final OrderRepository orderRepository;

    /**
     * Constructor injection ensures Spring Boot automatically supplies the dependencies.
     *
     * @param orderService the service implementation managing order operations
     * @param orderRepository database access interface for Order entity management
     */
    public OrderController(OrderServiceImpl orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    /**
     * checkout maps HTTP POST requests for placing new perfume orders.
     * Access control is managed globally inside SecurityConfig (requires valid JWT token).
     *
     * @param request the order payload containing quantity, phone number, and perfume ID
     * @return a ResponseEntity containing the generated order ID and a status message
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Order request) {
        System.out.println("Order Controller: Processing checkout request for phone " + request.getPhone());
        
        try {
            // Initiate the transaction and obtain the generated order ID
            String orderId = orderService.checkout(request);
            
            // Return 200 OK along with the tracking ID so the client can query it
            return ResponseEntity.ok(Map.of(
                    "orderId", orderId,
                    "message", "STK push triggered for phone number: " + request.getPhone()
            ));
        } catch (Exception e) {
            System.err.println("Order Controller Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET endpoint to query status of a checkout transaction.
     * Access control is managed globally inside SecurityConfig (requires valid JWT token).
     *
     * @param id the order ID
     * @return the Order details including status
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderStatus(@PathVariable String id) {
        System.out.println("Order Controller: Querying status for Order ID " + id);
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
