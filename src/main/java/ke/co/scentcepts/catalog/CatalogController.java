package ke.co.scentcepts.catalog;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController // marks this class as a REST controller
@RequestMapping("/api/perfumes") // base url for all endpoints in this controller
public class CatalogController {

    private final PerfumeRepository perfumeRepository; // dependency injection of PerfumeRepository

    // Catalog Controller constructor
    public CatalogController(PerfumeRepository perfumeRepository) {
        this.perfumeRepository = perfumeRepository;
    }

    // Publicly accessible endpoint (configured in SecurityConfig)
    // ("/api/perfumes")
    @GetMapping
    public ResponseEntity<List<Perfume>> getAllPerfumes() {
        List<Perfume> catalog = perfumeRepository.findAll();
        return ResponseEntity.ok(catalog);
    }

    @GetMapping("/{id}") // (/api/perfumes/{id})
    // @PathVariable binds the {id} in the URL to the id parameter in the method
    public ResponseEntity<Perfume> getPerfumeById(@PathVariable Long id) {
        return perfumeRepository.findById(id)
                .map(ResponseEntity::ok) // wraps the perfume in a 200 OK response
                .orElse(ResponseEntity.notFound().build()); // returns a 404 Not Found response if the perfume is not
                                                            // found
    }

    /**
     * POST endpoint to insert a new Perfume item.
     * Restricted to ROLE_ADMIN users in SecurityConfig.
     */
    @PostMapping
    public ResponseEntity<Perfume> createPerfume(@RequestBody Perfume perfume) {
        System.out.println("Admin API: Seeding new perfume: " + perfume.getName());
        return ResponseEntity.ok(perfumeRepository.save(perfume));
    }

    /**
     * PUT endpoint to modify details of an existing perfume.
     * Restricted to ROLE_ADMIN users in SecurityConfig.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Perfume> updatePerfume(@PathVariable Long id, @RequestBody Perfume details) {
        System.out.println("Admin API: Updating perfume ID: " + id);
        return perfumeRepository.findById(id).map(perfume -> {
            perfume.setName(details.getName());
            perfume.setBrand(details.getBrand());
            perfume.setPrice(details.getPrice());
            perfume.setStockCount(details.getStockCount());
            perfume.setDescription(details.getDescription());
            perfume.setImageUrl(details.getImageUrl());
            return ResponseEntity.ok(perfumeRepository.save(perfume));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE endpoint to delete a perfume item from database catalog.
     * Restricted to ROLE_ADMIN users in SecurityConfig.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePerfume(@PathVariable Long id) {
        System.out.println("Admin API: Deleting perfume ID: " + id);
        return perfumeRepository.findById(id).map(perfume -> {
            perfumeRepository.delete(perfume);
            return ResponseEntity.ok(Map.of("message", "Perfume deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST endpoint to upload raw dynamic files and save them locally.
     * Restricted to ROLE_ADMIN users in SecurityConfig.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println("Catalog Controller: Received file upload request for file " + file.getOriginalFilename());
        try {
            // Generate a safe unique filename to avoid naming conflicts on the local folder path
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            Path path = Paths.get("uploads").toAbsolutePath().resolve(fileName);
            
            // Create uploads folder inside project root if absent
            Files.createDirectories(path.getParent());
            
            // Write raw bytes to disk
            Files.write(path, file.getBytes());
            
            String imageUrl = "http://localhost:8080/uploads/" + fileName;
            System.out.println("Catalog Controller: File saved at: " + path.toString() + " -> " + imageUrl);
            
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            System.err.println("File upload error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}