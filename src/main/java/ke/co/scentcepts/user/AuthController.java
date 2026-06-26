package ke.co.scentcepts.user;

// import ke.co.scentcepts.user.UserRepository; // they are in the same dir so there is no need to import the file
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map; // maps unique keys to specific values acts like a dictonary.

// REST controller for handling user authentication (signup and signin) requests.
@RestController// this class handles HTTP requests
@RequestMapping("/api/auth")// base URL for all endpoints in this controller
public class AuthController {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection for UserRepository, JwtUtil, and PasswordEncoder
    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
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
}