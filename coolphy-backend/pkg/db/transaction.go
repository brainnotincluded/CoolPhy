package db

import "gorm.io/gorm"

// WithTransaction runs the given fn in a database transaction.
func WithTransaction(db *gorm.DB, fn func(tx *gorm.DB) error) error {
	return db.Transaction(func(tx *gorm.DB) error {
		return fn(tx)
	})
}
