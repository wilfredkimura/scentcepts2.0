package ke.co.scentcepts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync // Enables asynchronous processing for event listeners
@SpringBootApplication
public class ScentceptsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScentceptsApplication.class, args);
    }

}
