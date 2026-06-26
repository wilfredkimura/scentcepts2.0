// This filter intercepts every incoming request and if it finds
// a Bearer Token in the Authorization header it extracts the credentials
// and registers the user in Spring's global SecurityContext.

package ke.co.scentcepts.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ke.co.scentcepts.user.JwtUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
// JwtAuthenticationFilter is a servlet filter that intercepts every HTTP
// request to validate JWT tokens
// OncePerRequestFilter ensures that the filter runs only once per request
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    // constructor injection of JwtUtil
    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    // The doFilterInternal method is a protected method of the OncePerRequestFilter
    // class that is called for each request that passes through the filter
    // It is responsible for filtering HTTP requests and responses.
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Exit early if the request has no auth header or isn't a Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract the raw token string
        jwt = authHeader.substring(7);

        try {
            // 3. Decode the token using our utility
            userEmail = jwtUtil.extractEmail(jwt);
            String role = jwtUtil.extractRole(jwt);

            // 4. If the token contains an email and the context isn't already authenticated
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                if (jwtUtil.isTokenValid(jwt)) {
                    // 5. Construct the Spring Security authentication object
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null, // Credentials are null because the JWT itself is the credential
                            Collections.singletonList(new SimpleGrantedAuthority(role)));

                    // 6. Attach incoming request details (like IP address/session info)
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 7. Inject the user into the Security Context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token is malformed, expired, or tampered with
            System.err.println("JWT Verification failed: " + e.getMessage());
        }

        // 8. Pass the request to the next filter in the chain
        filterChain.doFilter(request, response);
    }
}