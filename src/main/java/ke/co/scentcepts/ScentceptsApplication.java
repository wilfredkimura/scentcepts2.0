package ke.co.scentcepts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // Enables asynchronous processing for event listeners (@EventListener)
public class ScentceptsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScentceptsApplication.class, args);
    }

}
