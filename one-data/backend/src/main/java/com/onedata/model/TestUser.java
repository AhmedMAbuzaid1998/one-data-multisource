package com.onedata.model;

import jakarta.persistence.*;

@Entity
@Table(name = "test_users")
public class TestUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String market;
    private String environment;
    private String userType;
    private String role;        // Chooser / User / N/A (only for Business)
    private String paymentType; // Post Paid / Pre Paid / Converged
    private String accountId;
    private String serviceId;

    public TestUser() {}

    public TestUser(String username, String market, String environment,
                    String userType, String role, String paymentType,
                    String accountId, String serviceId) {
        this.username = username;
        this.market = market;
        this.environment = environment;
        this.userType = userType;
        this.role = role;
        this.paymentType = paymentType;
        this.accountId = accountId;
        this.serviceId = serviceId;
    }

    // Getters
    public Long getId()            { return id; }
    public String getUsername()    { return username; }
    public String getMarket()      { return market; }
    public String getEnvironment() { return environment; }
    public String getUserType()    { return userType; }
    public String getRole()        { return role; }
    public String getPaymentType() { return paymentType; }
    public String getAccountId()   { return accountId; }
    public String getServiceId()   { return serviceId; }

    // Setters
    public void setId(Long id)                  { this.id = id; }
    public void setUsername(String username)     { this.username = username; }
    public void setMarket(String market)         { this.market = market; }
    public void setEnvironment(String env)       { this.environment = env; }
    public void setUserType(String userType)     { this.userType = userType; }
    public void setRole(String role)             { this.role = role; }
    public void setPaymentType(String p)         { this.paymentType = p; }
    public void setAccountId(String accountId)   { this.accountId = accountId; }
    public void setServiceId(String serviceId)   { this.serviceId = serviceId; }
}
