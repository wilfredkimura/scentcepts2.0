package ke.co.scentcepts.catalog;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PerfumeRepository extends JpaRepository<Perfume, Long> {

    // Safely locks the database row for concurrent payment callbacks
    // This tells PostgreSQL to issue a SELECT ... FOR UPDATE statement,
    // preventing any other thread from modifying or reading this row until the
    // current transaction commits.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Perfume p WHERE p.id = :id")
    Optional<Perfume> findByIdForUpdate(@Param("id") Long id);
}