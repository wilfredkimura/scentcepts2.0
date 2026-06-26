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

    private String orderId;
    private Long perfumeId;
    private Integer quantity;
    private String status; // PENDING, COMPLETED, FAILED

    public PaymentTransaction() {
    }

    public PaymentTransaction(String checkoutRequestId, String orderId, Long perfumeId, Integer quantity) {
        this.checkoutRequestId = checkoutRequestId;
        this.orderId = orderId;
        this.perfumeId = perfumeId;
        this.quantity = quantity;
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
}