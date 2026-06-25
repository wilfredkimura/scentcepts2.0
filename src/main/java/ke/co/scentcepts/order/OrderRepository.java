package ke.co.scentcepts.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// implements SpringBoot internal JPARepository
// Acts as a bridge between the application and the database in this case a relational database.

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {}