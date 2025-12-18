-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:8889
-- Généré le : jeu. 18 déc. 2025 à 13:35
-- Version du serveur : 8.0.40
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `sabai_db2`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `email`, `created_at`, `last_login`, `is_active`) VALUES
(3, 'admin', '$2b$10$8tdhf55.lPvTZv2FIWGUNu0cu5NaTJxtc5YctcyS8afc9vCuWz7Ai', 'admin@sabai.com', '2025-12-09 09:09:20', '2025-12-18 12:05:39', 1);

-- --------------------------------------------------------

--
-- Structure de la table `customers`
--

CREATE TABLE `customers` (
  `id` int NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_orders` int DEFAULT '0',
  `total_spent` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_order_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL,
  `order_type` enum('delivery','takeaway') COLLATE utf8mb4_unicode_ci DEFAULT 'delivery',
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `delivery_date` date NOT NULL,
  `delivery_time` time NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `delivery_fee` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','confirmed','preparing','delivering','ready','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','paid','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` enum('card','cash','online') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `payment_session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `order_type`, `customer_name`, `customer_email`, `customer_phone`, `delivery_address`, `delivery_date`, `delivery_time`, `total_amount`, `delivery_fee`, `notes`, `status`, `payment_status`, `payment_method`, `payment_session_id`, `created_at`, `updated_at`) VALUES
(44, 'takeaway', 'Kevin Khek', 'supaco.digital@gmail.com', '0783052412', NULL, '2025-12-16', '16:15:00', 12.50, 0.00, NULL, 'cancelled', 'paid', 'card', 'cs_test_a1nOJjsqC0WWDBfgr23yU3tPbvdhJ6FGMG2Kc4FX79U5DK95MkA8lGSo9b', '2025-12-16 14:16:31', '2025-12-16 20:47:25'),
(45, 'takeaway', 'Kevin Khek', 'supaco.digital@gmail.com', '0783052412', NULL, '2025-12-16', '22:15:00', 113.00, 0.00, 'lol', 'completed', 'paid', 'card', 'cs_test_a1VVqwe7Iy2vwik4xLRwhThTlulKyEW601VHooMBZsuJgBectYh1wYB6Oj', '2025-12-16 20:48:41', '2025-12-18 12:05:46'),
(46, 'takeaway', 'Kevin Khek', 'supaco.digital@gmail.com', '0783052412', NULL, '2025-12-18', '13:30:00', 113.00, 0.00, NULL, 'completed', 'paid', 'card', 'cs_test_a1BW7ZjHhPJJAxI6Nt6JkudhRrgSAYBmwqFzbkd5KqkjQ28cd2bkutPhD8', '2025-12-18 12:05:30', '2025-12-18 12:05:48');

-- --------------------------------------------------------

--
-- Structure de la table `order_history`
--

CREATE TABLE `order_history` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_items`
--

CREATE TABLE `order_items` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS ((`quantity` * `price`)) STORED,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `price`, `created_at`) VALUES
(87, 45, 102, 'Box de Noël', 1, 69.00, '2025-12-16 20:48:41'),
(88, 45, 103, 'Box Sabai', 1, 44.00, '2025-12-16 20:48:41'),
(89, 46, 102, 'Box de Noël', 1, 69.00, '2025-12-18 12:05:30'),
(90, 46, 103, 'Box Sabai', 1, 44.00, '2025-12-18 12:05:30');

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int DEFAULT '0',
  `available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category`, `image_url`, `stock`, `available`, `created_at`, `updated_at`, `deleted_at`) VALUES
(102, 'Box de Noël', '44 pièces : 6 ice saumon fumé, 6 Spring foie gras figue, 8 Bora bora tuna, 6 California saumon avocat, 8 Tokyo saumon, 2 nigiri saumon, 2 nigiri tuna piment, 2 nigiri crevette, 2 nigiri saumon fumé citron caviar, 2 nigiri roquette noix cheese', 69.00, 'SUSHI', NULL, 8, 1, '2025-12-16 19:32:51', '2025-12-18 12:05:30', NULL),
(103, 'Box Sabai', '42 pièces : 4 nigiri saumon, 6 california saumon avocat, 6 california crevette tempura avocat, 6 maki saumon, 6 ice saumon cheese, 6 croquant crevette tempura, 6 maki concombre cheese', 44.00, 'SUSHI', NULL, 8, 1, '2025-12-16 19:32:51', '2025-12-18 12:05:30', NULL),
(104, 'Bobun', 'Vermicelle de riz, boeuf, salade, carotte, concombre, oignon, menthe, coriandre, nem poulet', 16.00, 'BOWL', NULL, 16, 1, '2025-12-16 19:32:51', '2025-12-18 13:33:11', NULL),
(105, 'Lok Lak', 'Riz nature, boeuf, salade, tomate, oignon, oeuf, coriandre, citron, poivre', 16.00, 'BOWL', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-18 13:33:16', NULL),
(106, 'Poulet Crousti', 'Riz nature, poulet, courgette, oignon frit, ciboulette, sauce chili thaï', 16.00, 'BOWL', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-18 13:33:22', NULL),
(107, 'Bao Poulet Crousti', 'Carotte, concombre, mayo spicy, chili thaï, herbes fraîches', 7.00, 'BAO', NULL, 10, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:10', NULL),
(108, 'Bao Crevette Dynamite', 'Choux rouge, mayo spicy, chili thaï, ciboulette', 7.50, 'BAO', NULL, 10, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:02', NULL),
(109, 'Spring Poulet', 'Rouleaux de printemps, vermicelle, salade, crudités, herbes fraîches', 3.50, 'SPRING', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:44', NULL),
(110, 'Spring Crevette', 'Rouleaux de printemps, vermicelle, salade, crudités, herbes fraîches', 3.90, 'SPRING', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:06', NULL),
(111, 'Spring Boeuf', 'Rouleaux de printemps, vermicelle, salade, crudités, herbes fraîches', 3.90, 'SPRING', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:36', NULL),
(112, 'Spring Porc Laqué', 'Rouleaux de printemps, vermicelle, salade, crudités, herbes fraîches', 3.90, 'SPRING', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:16', NULL),
(113, 'Spring Omelette Tamago/Champignon', 'Rouleaux de printemps, vermicelle, salade, crudités, herbes fraîches', 3.50, 'SPRING', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:21', NULL),
(114, 'Mini Bowl Bobun', 'Vermicelle, crudités, boeuf, nem poulet, herbes fraîches', 9.90, 'MINI-BOWL', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:23', NULL),
(115, 'Mini Bowl Sukiyaki', 'Vermicelle, champignon, boeuf, crevette, herbes fraîches', 9.90, 'MINI-BOWL', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:38', NULL),
(116, 'Mini Bowl Yakitori', 'Riz vinaigré, choux, brochette de poulet, ciboulette', 9.90, 'MINI-BOWL', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:41', NULL),
(117, 'Mini Bowl Porc Laqué', 'Riz cantonais, saucisse de porc, poitrine de porc, ciboulette', 9.90, 'MINI-BOWL', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:26', NULL),
(118, 'Mini Bowl Udon', 'Champignon, kimchi, ciboulette, nori, graine de sésame', 9.90, 'MINI-BOWL', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:40', NULL),
(119, 'Nem Poulet', '2 pièces', 3.90, 'TAPAS', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:48', NULL),
(120, 'Samoussa Légumes', '2 pièces', 3.20, 'TAPAS', NULL, 0, 1, '2025-12-16 19:32:51', '2025-12-16 19:40:54', NULL),
(121, 'Boulette de Boeuf/Porc Frit', '2 pièces', 2.50, 'TAPAS', NULL, 12, 1, '2025-12-16 19:32:51', '2025-12-16 20:42:34', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `service_closures`
--

CREATE TABLE `service_closures` (
  `id` int NOT NULL,
  `closure_date` date NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_all_day` tinyint(1) DEFAULT '1',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `service_closures`
--

INSERT INTO `service_closures` (`id`, `closure_date`, `reason`, `is_all_day`, `start_time`, `end_time`, `created_at`) VALUES
(1, '2025-12-25', 'noel', 1, NULL, NULL, '2025-12-09 09:21:22');

-- --------------------------------------------------------

--
-- Structure de la table `service_hours`
--

CREATE TABLE `service_hours` (
  `id` int NOT NULL,
  `day_of_week` tinyint NOT NULL COMMENT '0=Dimanche, 6=Samedi',
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `service_hours`
--

INSERT INTO `service_hours` (`id`, `day_of_week`, `opening_time`, `closing_time`, `is_active`, `updated_at`) VALUES
(1, 0, '12:00:00', '22:00:00', 0, '2025-12-16 19:04:24'),
(2, 1, '11:00:00', '22:00:00', 1, '2025-12-16 14:29:13'),
(3, 2, '11:00:00', '23:00:00', 1, '2025-12-16 20:48:15'),
(4, 3, '11:00:00', '22:00:00', 1, '2025-12-16 14:29:22'),
(5, 4, '11:00:00', '22:00:00', 1, '2025-12-16 14:29:26'),
(6, 5, '11:00:00', '22:00:00', 1, '2025-12-10 10:13:50'),
(7, 6, '11:00:00', '22:00:00', 1, '2025-12-10 10:13:58');

-- --------------------------------------------------------

--
-- Structure de la table `service_settings`
--

CREATE TABLE `service_settings` (
  `id` int NOT NULL,
  `setting_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `service_settings`
--

INSERT INTO `service_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'service_enabled', 'true', 'Service activé ou désactivé globalement', '2025-12-18 13:07:19'),
(2, 'delivery_enabled', 'true', 'Livraison activée ou désactivée', '2025-12-18 13:07:20'),
(3, 'delivery_fee', '', 'Frais de livraison en euros', '2025-12-16 21:33:27'),
(4, 'delivery_min_amount', '30.00', 'Montant minimum de commande pour livraison', '2025-12-09 08:33:35'),
(5, 'preparation_time_minutes', '20', 'Temps de préparation moyen en minutes', '2025-12-16 21:33:10'),
(6, 'max_orders_per_slot', '15', 'Nombre maximum de commandes par créneau horaire', '2025-12-09 08:33:35'),
(7, 'delivery_radius_km', '10', 'Rayon de livraison en kilomètres', '2025-12-09 08:33:35');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`);

--
-- Index pour la table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_total_orders` (`total_orders`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_session_id` (`payment_session_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_delivery_date` (`delivery_date`),
  ADD KEY `idx_order_type` (`order_type`),
  ADD KEY `idx_customer_email` (`customer_email`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `order_history`
--
ALTER TABLE `order_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_available` (`available`),
  ADD KEY `idx_name` (`name`);
ALTER TABLE `products` ADD FULLTEXT KEY `idx_search` (`name`,`description`);

--
-- Index pour la table `service_closures`
--
ALTER TABLE `service_closures`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_closure` (`closure_date`),
  ADD KEY `idx_closure_date` (`closure_date`);

--
-- Index pour la table `service_hours`
--
ALTER TABLE `service_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_day` (`day_of_week`);

--
-- Index pour la table `service_settings`
--
ALTER TABLE `service_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_key` (`setting_key`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT pour la table `order_history`
--
ALTER TABLE `order_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;

--
-- AUTO_INCREMENT pour la table `service_closures`
--
ALTER TABLE `service_closures`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `service_hours`
--
ALTER TABLE `service_hours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `service_settings`
--
ALTER TABLE `service_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `order_history`
--
ALTER TABLE `order_history`
  ADD CONSTRAINT `order_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
