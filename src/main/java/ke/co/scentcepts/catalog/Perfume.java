package ke.co.scentcepts.catalog;

import jakarta.persistence.*;
import java.math.BigDecimal;

// This is the JPA entity for the perfume table in the database.
// It represents the structure of a perfume in the database.
// @Entity tells Spring that this class is a JPA entity
// @Table tells Spring the name of the table in the database
// @Id tells Spring that the id field is the primary key
// @GeneratedValue tells Spring to generate the primary key automatically
// @Column tells Spring the name of the column in the database
// @Column(nullable = false) tells Spring that the column is not nullable
// @Column(columnDefinition = "TEXT") tells Spring the data type of the column
// @Column(name = "stock_count") tells Spring the name of the column in the database

@Entity
@Table(name = "perfumes")
public class Perfume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // primary key is generated automattically.
    private Long id;

    @Column(nullable = false)
    private String name;

    private String brand;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stockCount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    public Perfume() {
    }

    public Perfume(String name, String brand, BigDecimal price, Integer stockCount, String description) {
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.stockCount = stockCount;
        this.description = description;
    }

    public Perfume(String name, String brand, BigDecimal price, Integer stockCount, String description, String imageUrl) {
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.stockCount = stockCount;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockCount() {
        return stockCount;
    }

    public void setStockCount(Integer stockCount) {
        this.stockCount = stockCount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}