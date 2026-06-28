package ke.co.scentcepts.order;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import ke.co.scentcepts.user.User;
import ke.co.scentcepts.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

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
    
    // Injection of UserRepository to look up the currently logged-in user profile
    private final UserRepository userRepository;

    /**
     * Constructor injection ensures Spring Boot automatically supplies the dependencies.
     *
     * @param orderService the service implementation managing order operations
     * @param orderRepository database access interface for Order entity management
     * @param userRepository database access interface for User entity management
     */
    public OrderController(OrderServiceImpl orderService, OrderRepository orderRepository, UserRepository userRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
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
            // 1. Retrieve the authenticated user's email principal from the SecurityContext
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            
            // 2. Look up the User entity from the database using their email address
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Authenticated user account could not be found."));
            
            // 3. Inject the resolved database ID into the checkout request order object
            request.setUserId(user.getId());
            
            // 4. Initiate the transaction service to save the order and publish the checkout event
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
