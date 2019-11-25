-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Ноя 25 2019 г., 23:53
-- Версия сервера: 10.4.8-MariaDB
-- Версия PHP: 7.1.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `dimpola`
--

-- --------------------------------------------------------

--
-- Структура таблицы `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `authorized_token` varchar(255) COLLATE cp1251_ukrainian_ci NOT NULL,
  `refresh_token` varchar(255) COLLATE cp1251_ukrainian_ci NOT NULL,
  `fingerprint` varchar(255) COLLATE cp1251_ukrainian_ci NOT NULL,
  `create_time` int(100) NOT NULL,
  `expires_in` int(100) NOT NULL DEFAULT 1800000
) ENGINE=InnoDB DEFAULT CHARSET=cp1251 COLLATE=cp1251_ukrainian_ci;

--
-- Дамп данных таблицы `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `authorized_token`, `refresh_token`, `fingerprint`, `create_time`, `expires_in`) VALUES
(9, 1, 'aba8bdf7d6c28f6c516abb466b94ff35', '003605b44fcf8d5b46d59e750dd5336c', '56d89417278a6d8723841935f38b1f05', 2147483647, 1800000),
(10, 2, '81959db3e400986e3caf6fed0e6f92a6', '778b61c78b139516cedde38bc6aab98c', '56d89417278a6d8723841935f38b1f05', 2147483647, 1800000);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `login` varchar(100) COLLATE cp1251_ukrainian_ci NOT NULL,
  `name` varchar(100) COLLATE cp1251_ukrainian_ci NOT NULL,
  `email` varchar(256) COLLATE cp1251_ukrainian_ci NOT NULL,
  `password` varchar(256) COLLATE cp1251_ukrainian_ci NOT NULL,
  `soult` varchar(256) COLLATE cp1251_ukrainian_ci NOT NULL,
  `avatar` varchar(100) COLLATE cp1251_ukrainian_ci NOT NULL DEFAULT './img/defaultAvatar.jpg'
) ENGINE=InnoDB DEFAULT CHARSET=cp1251 COLLATE=cp1251_ukrainian_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `name`, `email`, `password`, `soult`, `avatar`) VALUES
(1, 'admin', 'admin', 'admin@mychat.mail', 'b9111be6f35a37446a21aa17765c2675', '1574520378604', './img/defaultAvatar.jpg'),
(2, 'admin2', 'adminTwo', 'admin2@mychat.mail', '493e6758a06c6d6eeb15e246ea3a9e77', '1574520445258', './img/defaultAvatar.jpg');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
