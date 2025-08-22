#!/bin/bash

# Orderly Database Management Script
# This script helps manage the local MySQL database for testing

set -e

case "$1" in
  "start")
    echo "🚀 Starting Orderly MySQL database..."
    docker-compose -f docker-compose.orderly.yml up -d
    echo "✅ Orderly MySQL database started on port 3307"
    echo "📊 Connection details:"
    echo "   Host: localhost"
    echo "   Port: 3307"
    echo "   Database: orderly_test"
    echo "   Username: orderly_user"
    echo "   Password: orderly_password"
    echo "   URL: mysql://orderly_user:orderly_password@localhost:3307/orderly_test"
    ;;
  
  "stop")
    echo "🛑 Stopping Orderly MySQL database..."
    docker-compose -f docker-compose.orderly.yml down
    echo "✅ Orderly MySQL database stopped"
    ;;
  
  "restart")
    echo "🔄 Restarting Orderly MySQL database..."
    docker-compose -f docker-compose.orderly.yml down
    docker-compose -f docker-compose.orderly.yml up -d
    echo "✅ Orderly MySQL database restarted"
    ;;
  
  "logs")
    echo "📋 Showing Orderly MySQL database logs..."
    docker-compose -f docker-compose.orderly.yml logs -f
    ;;
  
  "connect")
    echo "🔌 Connecting to Orderly MySQL database..."
    docker exec -it orderly-mysql-test mysql -u orderly_user -porderly_password orderly_test
    ;;
  
  "reset")
    echo "🗑️ Resetting Orderly MySQL database..."
    docker-compose -f docker-compose.orderly.yml down -v
    docker-compose -f docker-compose.orderly.yml up -d
    echo "✅ Orderly MySQL database reset and restarted"
    ;;
  
  "status")
    echo "📊 Orderly MySQL database status:"
    docker-compose -f docker-compose.orderly.yml ps
    ;;
  
  *)
    echo "Usage: $0 {start|stop|restart|logs|connect|reset|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the Orderly MySQL database"
    echo "  stop    - Stop the Orderly MySQL database"
    echo "  restart - Restart the Orderly MySQL database"
    echo "  logs    - Show database logs"
    echo "  connect - Connect to the database via MySQL client"
    echo "  reset   - Reset the database (removes all data)"
    echo "  status  - Show database status"
    echo ""
    echo "Environment variable to set:"
    echo "  ORDERLY_DATABASE_URL=mysql://orderly_user:orderly_password@localhost:3307/orderly_test"
    exit 1
    ;;
esac
