package ke.co.scentcepts.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Expose BCrypt as a bean for the AuthController to use
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Global HTTP rules for entire Scentcepts application. This is where we define which endpoints are public and which require authentication.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless JWT APIs
            .cors(cors -> cors.configure(http)) // Allow Next.js cross-origin requests
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Publicly accessible endpoints
                .requestMatchers("/api/auth/**").permitAll()        
                .requestMatchers("/api/perfumes").permitAll()       
                .requestMatchers("/api/payments/callback").permitAll() 
                // All other endpoints require authentication
                .anyRequest().authenticated()                       
            );
            
        return http.build();
    }
}