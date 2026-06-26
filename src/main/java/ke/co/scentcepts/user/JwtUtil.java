// This component is responsible for generating JWT tokens for authenticated users.
// Uses the jwt library to create tokens with a secret key and expiration time.
package ke.co.scentcepts.user;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // In a real production environment, load this from application.properties
    // TODO: Load this from application.properties
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final long expirationTime = 86400000; // 24 hours in milliseconds

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    // --- New Parsing Methods for the Filter ---
    // This method allows us to extract the email and role securely from the token

    // method extracts all claims from the token
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // method extracts email
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // method extracts role
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // method checks if token is valid otherwise throws an exception
    public boolean isTokenValid(String token) {
        try {
            return !extractAllClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}