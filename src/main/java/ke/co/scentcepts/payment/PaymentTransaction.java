package ke.co.scentcepts.payment;

import jakarta.persistence.*;

@Entity // represents the PaymentTransaction entity.
@Table(name = "payment_transactions") // represents the payment_transactions table
public class PaymentTransaction {

    @Id // Primary key of the payment_transactions table
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto generated key
    private Long id;

    @Column(unique = true, nullable = false) // unique and not null
    private String checkoutRequestId; // Safaricom's tracking ID

    private String orderId; // Associated Order ID in orders table
    private Long perfumeId; // Associated Perfume ID in perfumes table
    private Integer quantity; // Item quantity purchased
    private String status; // Status of transaction: PENDING, COMPLETED, FAILED
    private Long userId; // Associated User ID in users table

    public PaymentTransaction() {
    }

    // Constructor to instantiate a new PaymentTransaction tracking log
    public PaymentTransaction(String checkoutRequestId, String orderId, Long perfumeId, Integer quantity, Long userId) {
        this.checkoutRequestId = checkoutRequestId;
        this.orderId = orderId;
        this.perfumeId = perfumeId;
        this.quantity = quantity;
        this.userId = userId;
        this.status = "PENDING";
    }

    // Standard Getters and Setters
    public Long getId() {
        return id;
    }

    public String getCheckoutRequestId() {
        return checkoutRequestId;
    }

    public String getOrderId() {
        return orderId;
    }

    public Long getPerfumeId() {
        return perfumeId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}