package ke.co.scentcepts.user;

// import ke.co.scentcepts.user.UserRepository; // they are in the same dir so there is no need to import the file
import ke.co.scentcepts.order.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AuthController manages user signups, signins, and secure admin endpoints.
 * It coordinates JWT generation, bcrypt password hashing, and user/order data dumps for dashboards.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    // Repository managing persistence operations for the User entity
    private final UserRepository userRepository;
    
    // Repository managing persistence operations for the Order entity
    private final OrderRepository orderRepository;
    
    // Utility component to create, decode and validate JWT tokens
    private final JwtUtil jwtUtil;
    
    // Security encoder to securely hash and verify user passwords
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor injection ensures Spring automatically injects repositories and encoders on startup.
     */
    public AuthController(UserRepository userRepository, OrderRepository orderRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // Endpoint for user registration (signup)
    // Accepts a JSON payload with email and password, hashes the password, and saves the new user to the database.
    @PostMapping("/signup") // handles POST requests to /api/auth/signup
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signupRequest) {
        String email = signupRequest.get("email");
        String rawPassword = signupRequest.get("password");

        // Check if the email is already registered
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already in use");
        }
        
        // Hash the password using BCrypt before saving
        String hashedPassword = passwordEncoder.encode(rawPassword);
        
        User newUser = new User(email, hashedPassword, "ROLE_CUSTOMER");
        userRepository.save(newUser);
        
        return ResponseEntity.ok(Map.of("message", "User registered securely"));
    }

    @PostMapping("/signin") // handles POST requests to /api/auth/signin
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String rawPassword = loginRequest.get("password");

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Compare the raw password from the request with the BCrypt hash in the database
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        // Generate token upon successful password match
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        
        // Return the token and user details in the response
        return ResponseEntity.ok(Map.of(
            "token", token,
            "email", user.getEmail(),
            "role", user.getRole()
        ));
    }

    /**
     * GET endpoint to retrieve registered users.
     * Restricted to authenticated users holding ROLE_ADMIN authority.
     * 
     * @return list of user mappings (excluding password hashes for safety)
     */
    @GetMapping("/admin/users")
    public ResponseEntity<?> getAdminUsers() {
        System.out.println("Admin API: Retrieving account listings...");
        
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> Map.of(
                        "id", (Object) user.getId(),
                        "email", (Object) user.getEmail(),
                        "role", (Object) user.getRole()
                ))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(users);
    }

    /**
     * GET endpoint to retrieve order logs.
     * Restricted to authenticated users holding ROLE_ADMIN authority.
     * 
     * @return list of order transaction data
     */
    @GetMapping("/admin/orders")
    public ResponseEntity<?> getAdminOrders() {
        System.out.println("Admin API: Retrieving placed order data...");
        return ResponseEntity.ok(orderRepository.findAll());
    }
}