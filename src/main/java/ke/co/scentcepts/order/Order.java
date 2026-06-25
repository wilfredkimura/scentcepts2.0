package ke.co.scentcepts.order;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "orders")
public class Order {

    //Order Blueprint
    @Id
    private String id;
    private String phone;
    private BigDecimal amount;
    private Long perfumeId;
    private Integer quantity;
    private String status; // PENDING, COMPLETED, FAILED

    public Order() {}

    // Order Class constructor
    public Order(String id, String phone, BigDecimal amount, Long perfumeId, Integer quantity) {
        this.id = id;
        this.phone = phone;
        this.amount = amount;
        this.perfumeId = perfumeId;
        this.quantity = quantity;
        this.status = "PENDING";
    }

    // Standard Getters and Setters omitted for brevity
    public String getId() { return id; }
    public String getPhone() { return phone; }
    public BigDecimal getAmount() { return amount; }
    public Long getPerfumeId() { return perfumeId; }
    public Integer getQuantity() { return quantity; }
    public void setStatus(String status) { this.status = status; }
}