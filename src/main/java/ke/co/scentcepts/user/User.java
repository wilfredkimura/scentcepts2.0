package ke.co.scentcepts.user;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Unique identifier for the user
    private Long id;
    
    // Email of the user, must be unique and not null
    @Column(unique = true, nullable = false)
    private String email;
    
    // Password of the user, must not be null
    // todo: Consider hashing the password.
    @Column(nullable = false, length = 60 // length set to 60 because BCrypt hashed passwords are 60 characters long
    )
    private String password;
    
    // Role of the user
    private String role; // ROLE_CUSTOMER, ROLE_ADMIN

    public User() {} // Default constructor for JPA

    // Constructor to create a new User with email, password, and role
    public User(String email, String encodedPassword, String role) {
        this.email = email;
        this.password = encodedPassword;
        this.role = role;
    }

    // Getters and Setters 
    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String encodedPassword) { this.password = encodedPassword; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}