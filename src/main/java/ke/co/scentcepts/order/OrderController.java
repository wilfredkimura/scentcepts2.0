package ke.co.scentcepts.order;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import ke.co.scentcepts.user.User;
import ke.co.scentcepts.user.UserRepository;
import ke.co.scentcepts.catalog.PerfumeRepository;
import ke.co.scentcepts.payment.PaymentTransactionRepository;
import ke.co.scentcepts.payment.PaymentTransaction;
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

    // Injection of PerfumeRepository to fetch catalog details for receipts
    private final PerfumeRepository perfumeRepository;

    // Injection of PaymentTransactionRepository to store transaction receipts
    private final PaymentTransactionRepository transactionRepository;

    /**
     * Constructor injection ensures Spring Boot automatically supplies the dependencies.
     */
    public OrderController(
            OrderServiceImpl orderService, 
            OrderRepository orderRepository, 
            UserRepository userRepository,
            PerfumeRepository perfumeRepository,
            PaymentTransactionRepository transactionRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.perfumeRepository = perfumeRepository;
        this.transactionRepository = transactionRepository;
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

    /**
     * POST endpoint to simulate a successful Safaricom callback transaction.
     * Accessible by authenticated users.
     */
    @PostMapping("/{id}/mock-pay")
    public ResponseEntity<?> mockPay(@PathVariable String id) {
        System.out.println("Order Controller: Simulating mock payment callback for Order ID: " + id);
        try {
            // Retrieve pending order
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with ID: " + id));

            // Transition status to COMPLETED
            order.setStatus("COMPLETED");
            orderRepository.save(order);

            // Log and persist transaction record in database
            PaymentTransaction transaction = new PaymentTransaction(
                    "MOCK_" + System.currentTimeMillis(),
                    order.getId(),
                    order.getPerfumeId(),
                    order.getQuantity(),
                    order.getUserId()
            );
            transaction.setStatus("COMPLETED");
            transactionRepository.save(transaction);

            System.out.println("Order Controller: Mock payment processed. Order & Transaction transitioned to COMPLETED.");
            return ResponseEntity.ok(Map.of("message", "Mock payment processed successfully", "orderId", id));
        } catch (Exception e) {
            System.err.println("Mock payment error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET endpoint to retrieve standard users' past completed receipts.
     * Accessible by authenticated users.
     */
    @GetMapping("/my-receipts")
    public ResponseEntity<?> getMyReceipts() {
        System.out.println("Order Controller: Retrieving receipts for authenticated user");
        try {
            // Find authenticated user email principal
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Authenticated user details not found."));

            // Get completed orders placed by user ID
            List<Order> orders = orderRepository.findAll().stream()
                    .filter(o -> o.getUserId() != null && o.getUserId().equals(user.getId()))
                    .filter(o -> "COMPLETED".equals(o.getStatus()))
                    .collect(Collectors.toList());

            // Map order invoices with catalog description names and image links
            List<Map<String, Object>> receipts = orders.stream().map(order -> {
                String perfumeName = "Unknown Fragrance";
                String perfumeBrand = "Scentcepts";
                String perfumeImageUrl = "";

                if (order.getPerfumeId() != null) {
                    var perfumeOpt = perfumeRepository.findById(order.getPerfumeId());
                    if (perfumeOpt.isPresent()) {
                        perfumeName = perfumeOpt.get().getName();
                        perfumeBrand = perfumeOpt.get().getBrand();
                        perfumeImageUrl = perfumeOpt.get().getImageUrl();
                    }
                }

                Map<String, Object> receipt = new java.util.HashMap<>();
                receipt.put("id", order.getId());
                receipt.put("phone", order.getPhone());
                receipt.put("amount", order.getAmount());
                receipt.put("quantity", order.getQuantity());
                receipt.put("status", order.getStatus());
                receipt.put("perfumeName", perfumeName);
                receipt.put("perfumeBrand", perfumeBrand);
                receipt.put("perfumeImageUrl", perfumeImageUrl != null ? perfumeImageUrl : "");
                return receipt;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            System.err.println("Error fetching receipts: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
