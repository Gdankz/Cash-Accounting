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

type Budget struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Name      string    `json:"name"`
	Amount    float64   `json:"amount"`
	Expenses  []Expense `gorm:"foreignkey:BudgetID" json:"expenses" constraint:OnDelete:CASCADE;"`
	CreatedAt time.Time `json:"created_at"`
}
type Expense struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	BudgetID  uint      `json:"budget_id"`
	Name      string    `json:"name"`
	Amount    float64   `json:"amount"`
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

	db.AutoMigrate(&Budget{}, &Expense{})
	log.Println("Database PostgreSQL connected")
}

func main() {
	initDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/api/budgets", func(c *gin.Context) {
		var budgets []Budget
		db.Preload("Expenses").Order("created_at desc").Find(&budgets)
		c.JSON(http.StatusOK, budgets)
	})

	r.POST("/api/budgets", func(c *gin.Context) {
		var newBudget Budget
		if err := c.ShouldBind(&newBudget); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format salah"})
			return
		}
		newBudget.CreatedAt = time.Now()
		db.Create(&newBudget)
		c.JSON(http.StatusCreated, newBudget)
	})

	r.DELETE("/api/budgets/:id", func(c *gin.Context) {
		id := c.Param("id")
		db.Delete(&Budget{}, id)
		c.JSON(http.StatusOK, gin.H{"message": "Budget berhasil dihapus"})
	})

	r.POST("/api/expenses", func(c *gin.Context) {
		var newExpenses Expense
		if err := c.ShouldBind(&newExpenses); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format salah"})
			return
		}
		newExpenses.CreatedAt = time.Now()
		db.Create(&newExpenses)
		c.JSON(http.StatusCreated, newExpenses)
	})

	r.DELETE("/api/expenses/:id", func(c *gin.Context) {
		id := c.Param("id")
		db.Delete(&Expense{}, id)
		c.JSON(http.StatusOK, gin.H{"message": "Expenses berhasil dihapus"})
	})

	r.Run(":8080")

}
