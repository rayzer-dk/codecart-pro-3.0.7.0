# CodeCart PRO: аудит и обновление зависимостей (19 ноября 2026)
Ветка: experiment/bootstrap5-compat-fa7. Основная ветка main не менялась.

## Выполнено
1. Исправлены оба совместимых загрузчика jquery-2.1.1.min.js: теперь используют jQuery 3.8.0 + Migrate 3.6.0, если jQuery ещё не загружена.
2. По умолчанию для экспериментальной ветки: jQuery 4.1.0 + Migrate 4.0.2. В админке и двух штатных темах можно временно вернуться на jQuery 3.8.0 / Migrate 3.6.0 через ?ccp_jquery4=0. Одновременная загрузка нескольких версий в штатном заголовке не допускается.
3. CodeMirror 6 подключён к редактированию Twig-шаблонов (design/theme) и XML-модификаторов (marketplace/modification_form). Adapter сохраняет getValue/setValue/save/setSize/getWrapperElement/fromTextArea и синхронизирует textarea. Для отката использовать ?ccp_cm6=0. CodeMirror 5 оставлен для существующей интеграции Summernote.
4. Guzzle 8.5.2, guzzlehttp/promises 3.1.0, guzzlehttp/psr7 3.5.0: обновлены composer.json и composer.lock, успешно проверены в Composer при PHP 8.1. Vendor-директория не хранится в GitHub; развёртывание требует composer install.
5. Moment.js 2.31.0: синхронизированы обе директории admin/catalog с полными и сокращёнными сборками, включая локализации. Используется для резервной старой даты; предпочтительная новая связка — Air Datepicker 3.6.0 + Day.js 1.11.23.
6. Flot 4.2.6: современный дистрибутив загружен в codecart-modern/flot-4.2.6 и обновлены совместимые точки входа jquery/flot/jquery.flot.js и jquery.flot.min.js. Часть исторических отдельностоящих расширений 0.8.1 оставлена и требует ревизии/удаления перед выпуском.
7. jQVMap 1.5.1: обновлены JS, CSS и семь картографических файлов (европейская карта и континенты).
8. Bootstrap 5.3.9, Font Awesome Free 7.3.1 и Summernote 0.9.1 BS5 сохранены из предыдущего этапа.

## Результаты автоматических проверок
GitHub Actions CodeCart Modernization Pilot QA, run 44546618843 (success):
- PHP 8.1, синтаксис контроллеров, Composer, контракты UniShop2 и OCMOD;
- Chromium: Bootstrap 5 (375/650/900/1050/1400), модальные окна, dropdown/tab/collapse, JS bridge;
- Chromium: jQuery 4.1.0 + Migrate 4.0.2, CodeMirror 6 (ввод, sync textarea, уничтожение), Flot 4.2.6 (рисование), jQVMap 1.5.1 (рисование SVG карты) на 375/1280;
- Chromium: Summernote и Air Datepicker + Day.js на jQuery 3 и jQuery 4.
Статический аудит подключений Bootstrap 3 не выявил непредусмотренных импортов.

## Откаты
?ccp_jquery4=0 — только текущий запрос, вернуться на jQuery 3.8 / Migrate 3.6.
?ccp_bs5=0 — только текущий запрос, вернуться на Bootstrap 3 / Font Awesome 6.
?ccp_cm6=0 — редакторы Twig/XML на CodeMirror 5.
?ccp_date=air — новый календарь по запросу (по умолчанию старый).
Параметры URL не сохраняются на следующих страницах.

## Почему Symfony 7 пока не включён
Symfony 7.4 LTS требует PHP >= 8.2. Требование CodeCart PRO — PHP 8.1–8.5.
Сохраняем symfony/filesystem 6.4.x, иначе будет нарушена поддержка PHP 8.1.
Если минимум PHP когда-нибудь изменится на 8.2, Symfony 7 можно проверить отдельно с Composer.

## Незавершённые проверки и риски
Это тестируемая экспериментальная ветка, а не production-ready релиз. Не выполнены сквозные тесты установленного магазина с реальной БД, сторонними расширениями OpenCart/ocStore, полной интеграцией UniShop2, OCMOD, Events, платёжными системами и оформлением заказа.
jQuery 4 удаляет старые API; Migrate 4 не восстанавливает все API из эпохи jQuery 1/2.
CodeMirror 6 совместим со штатными двумя формами через собственный мост, но все сторонние расширения CodeMirror 5 не переписаны.
Некоторые старые Flot addons 0.8.1 не должны смешиваться с Flot 4; не проверена их совместимость.
Новый календарь ещё не включён по умолчанию.
Глубокие PHPStan/dead-code аудиты независимы от библиотечного smoke-отчёта; успех этого workflow не означает прохождение всех остальных workflows.
