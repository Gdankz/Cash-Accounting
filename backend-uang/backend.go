package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Transaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

var db *gorm.DB

func initDB() {
	dsn := "host=localhost user=postgres password=040448 dbname=CashAccounting_db port=5432 sslmode=disable TimeZone=Asia/Jakarta"

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database", err)
	}

	err = db.AutoMigrate(&Transaction{})
	if err != nil {
		log.Fatal("failed to migrate database", err)
	}

	log.Println("Database PostgreSQL connected")
}

func main() {
	initDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/api/transactions", func(c *gin.Context) {
		var transactions []Transaction
		db.Order("created_at desc").Find(&transactions)
		c.JSON(http.StatusOK, transactions)
	})

	r.POST("/api/transactions", func(c *gin.Context) {
		var newTransaction Transaction
		if err := c.ShouldBindBodyWithJSON(&newTransaction); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to save Transaction to Database"})
			return
		}

		c.JSON(http.StatusOK, newTransaction)
	})

	r.DELETE("/api/transactions/:id", func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&Transaction{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
	})

	r.Run(":8080")
}
