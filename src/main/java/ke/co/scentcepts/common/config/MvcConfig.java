package ke.co.scentcepts.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

/**
 * MvcConfig registers a custom resource handler so that any image files
 * uploaded to the "uploads" directory in the project root can be served
 * dynamically at the /uploads/** HTTP path.
 */
@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve absolute path to the local "uploads" folder in the project root
        String uploadPath = Paths.get("uploads").toAbsolutePath().toString();
        
        System.out.println("MvcConfig: Dynamic uploads resource mapping configured for directory: " + uploadPath);
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
