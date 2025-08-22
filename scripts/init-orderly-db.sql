-- Initialize Orderly Database
-- This script creates the broker table for testing the Orderly database integration
USE orderly_test;

-- Create the broker table
CREATE TABLE `broker` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `broker_id` varchar(64) NOT NULL COMMENT 'broker_id',
  `created_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `broker_name` varchar(64) NOT NULL,
  `broker_hash` varchar(256) NOT NULL DEFAULT '' COMMENT 'broker_hash',
  `base_maker_fee_rate` decimal(28, 8) NOT NULL DEFAULT '0.00000000',
  `base_taker_fee_rate` decimal(28, 8) NOT NULL DEFAULT '0.00000000',
  `default_maker_fee_rate` decimal(28, 8) NOT NULL DEFAULT '0.00000000',
  `default_taker_fee_rate` decimal(28, 8) NOT NULL DEFAULT '0.00000000',
  `admin_account_id` varchar(128) DEFAULT NULL,
  `rebate_cap` decimal(4, 2) NOT NULL DEFAULT '1.00',
  `gross_fee_enable` tinyint(1) NOT NULL DEFAULT '0',
  `locked_rebate_allocation` tinyint(1) NOT NULL DEFAULT '0',
  `is_all_subside_taker_fee` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `broker_broker_id` (`broker_id`) USING BTREE,
  UNIQUE KEY `broker_broker_hash` (`broker_hash`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb3;

-- Show the created table
DESCRIBE broker;

-- Show sample data
SELECT
  *
FROM
  broker;