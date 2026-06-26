package ke.co.scentcepts.catalog;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}