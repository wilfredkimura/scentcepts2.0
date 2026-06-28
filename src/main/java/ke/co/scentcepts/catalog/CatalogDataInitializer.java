package ke.co.scentcepts.catalog;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import ke.co.scentcepts.user.User;
import ke.co.scentcepts.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.util.Arrays;

/**
 * CatalogDataInitializer implements CommandLineRunner to execute immediately upon application startup.
 * The class checks if the 'perfumes' and 'users' tables contain any data. If empty, it seeds the 
 * database with sample products and a default admin user.
 */
@Component
public class CatalogDataInitializer implements CommandLineRunner {

    // Injected repositories and password encoder for database seeding
    private final PerfumeRepository perfumeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor injection ensures the required repositories and encoder are supplied by Spring.
     */
    public CatalogDataInitializer(
            PerfumeRepository perfumeRepository, 
            UserRepository userRepository, 
            PasswordEncoder passwordEncoder) {
        this.perfumeRepository = perfumeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * The run method is triggered automatically by Spring Boot when the application context is successfully loaded.
     *
     * @param args command line arguments passed during launch (not used here)
     * @throws Exception if database persistence fails
     */
    @Override
    public void run(String... args) throws Exception {
        System.out.println("Catalog Data Initializer: Checking database records...");

        // Update or create initial perfume instances with real images and KSH prices
        updateOrCreatePerfume(
                "Chanel No. 5", 
                "Chanel", 
                new BigDecimal("19500.00"), 
                50, 
                "A legendary floral fragrance with notes of aldehydes, jasmine, and rose.",
                "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800"
        );

        updateOrCreatePerfume(
                "Sauvage", 
                "Dior", 
                new BigDecimal("15600.00"), 
                100, 
                "A radically fresh composition, raw and noble all at once, with calabrian bergamot and amberwood.",
                "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800"
        );

        updateOrCreatePerfume(
                "Bleu de Chanel", 
                "Chanel", 
                new BigDecimal("16900.00"), 
                75, 
                "An aromatic-woody fragrance that unites the invigorating freshness of citrus with the woody whisper of cedar.",
                "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800"
        );

        updateOrCreatePerfume(
                "Black Opium", 
                "Yves Saint Laurent", 
                new BigDecimal("18200.00"), 
                60, 
                "A seductive, warm and spicy fragrance highlighting notes of rich black coffee, vanilla, and sweet white flowers.",
                "https://images.unsplash.com/photo-1595425970377-c9703c48657a?auto=format&fit=crop&q=80&w=800"
        );

        // Check if the default administrator account exists in database. If absent, seed it automatically.
        if (userRepository.findByEmail("admin@scentcepts.com").isEmpty()) {
            System.out.println("Catalog Data Initializer: Seeding default administrator account...");
            User admin = new User(
                    "admin@scentcepts.com",
                    passwordEncoder.encode("admin123"),
                    "ROLE_ADMIN"
            );
            userRepository.save(admin);
            System.out.println("Catalog Data Initializer: Default administrator registered successfully.");
        } else {
            System.out.println("Catalog Data Initializer: Administrator account admin@scentcepts.com is already active.");
        }
    }

    private void updateOrCreatePerfume(String name, String brand, BigDecimal price, int stock, String description, String imageUrl) {
        perfumeRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase(name))
                .findFirst()
                .ifPresentOrElse(
                    p -> {
                        p.setBrand(brand);
                        p.setPrice(price);
                        p.setStockCount(stock);
                        p.setDescription(description);
                        p.setImageUrl(imageUrl);
                        perfumeRepository.save(p);
                        System.out.println("Catalog Data Initializer: Updated existing perfume record: " + name);
                    },
                    () -> {
                        Perfume p = new Perfume(name, brand, price, stock, description, imageUrl);
                        perfumeRepository.save(p);
                        System.out.println("Catalog Data Initializer: Created new perfume record: " + name);
                    }
                );
    }
}
