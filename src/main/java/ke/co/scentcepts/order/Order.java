package ke.co.scentcepts.order;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "orders")
public class Order {

    //Order Blueprint
    @Id
    private String id; // Unique transaction tracker generated during checkout
    
    private String phone; // Customer's M-Pesa phone number
    
    private BigDecimal amount; // Total price in KES
    
    private Long perfumeId; // ID of the perfume item ordered
    
    private Integer quantity; // Quantity ordered
    
    private String status; // Order progress state: PENDING, COMPLETED, FAILED
    
    private Long userId; // ID of the authenticated user who placed the order

    public Order() {}

    // Constructor to instantiate a new Order details object
    public Order(String id, String phone, BigDecimal amount, Long perfumeId, Integer quantity, Long userId) {
        this.id = id;
        this.phone = phone;
        this.amount = amount;
        this.perfumeId = perfumeId;
        this.quantity = quantity;
        this.userId = userId;
        this.status = "PENDING";
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getPhone() { return phone; }
    public BigDecimal getAmount() { return amount; }
    public Long getPerfumeId() { return perfumeId; }
    public Integer getQuantity() { return quantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}