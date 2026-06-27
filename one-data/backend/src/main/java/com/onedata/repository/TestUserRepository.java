package com.onedata.repository;

import com.onedata.model.TestUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestUserRepository extends JpaRepository<TestUser, Long> {

    @Query("SELECT u FROM TestUser u WHERE " +
           "(:market IS NULL OR u.market = :market) AND " +
           "(:environment IS NULL OR u.environment = :environment) AND " +
           "(:userType IS NULL OR u.userType = :userType) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:paymentType IS NULL OR u.paymentType = :paymentType) AND " +
           "(:accountId IS NULL OR LOWER(u.accountId) LIKE LOWER(CONCAT('%', :accountId, '%'))) AND " +
           "(:serviceId IS NULL OR LOWER(u.serviceId) LIKE LOWER(CONCAT('%', :serviceId, '%')))")
    List<TestUser> filterUsers(
            @Param("market")      String market,
            @Param("environment") String environment,
            @Param("userType")    String userType,
            @Param("role")        String role,
            @Param("paymentType") String paymentType,
            @Param("accountId")   String accountId,
            @Param("serviceId")   String serviceId
    );
}
