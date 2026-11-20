# 9.10 Команды и настройки (для админов)

- <code>/dreboss list|grant|revoke</code> - победы над боссами; <code>/dreboss grant &lt;босс&gt; &lt;игрок&gt;</code> выдаёт победу, если она была, но не засчиталась (например, босс побеждён до установки аддона) - от неё зависят и личные пропуски в миры. <code>/drerank</code> - ранги Divine у игроков онлайн (<a href="../../01-basics/1-1-rangi-i-etapy-pochemu/">1.1</a>). <code>/dreinv &lt;игрок&gt;</code> - что встроено в броню игрока и старые слоты. <code>/dredebug</code> - отладка: урон по шагам в чат и журнал CSV.
- <code>/dreblizzard start|stop</code> - метель, ливень и камнепад сразу; <code>/dreweather rain|quake start|stop</code>; <code>/dreminiboss</code> - мини-босс рядом; <code>/dreflyspeed</code>.
- Яйца призыва всех боссов аддона - во вкладке "Боссы и прогресс"; яйцо Странника.

<table>
<tr><th>Настройка</th><th>По умолчанию</th><th>Что делает</th></tr>
<tr><td>bossArenaHold, bossArenaLeaveSeconds, bossArenaRadius, bossNoFly, summonOnlyInLairs</td><td>true, 60, 24, true, true</td><td>арены боссов (<a href="../../01-basics/1-4-logovo-i-arena-bossa/">1.4</a>)</td></tr>
<tr><td>lairGap; map*</td><td>640; 5, 5000, 128, 10000</td><td>расстояние между логовами одного вида; карты логов (<a href="../../01-basics/1-7-karty-logov/">1.7</a>)</td></tr>
<tr><td>foreignMobsByStage</td><td>true</td><td>мобы чужих миров смотрят на этап (<a href="../../01-basics/1-1-rangi-i-etapy-pochemu/">1.1</a>)</td></tr>
<tr><td>worldGates</td><td>true</td><td>личные пропуски: сумеречные порталы и Кровать кошмаров пускают только дошедших до мира (2, 5.1, 6.2); false - всех, Аркана всё равно только после Смотрителя</td></tr>
<tr><td>tierFullReduction, tierSmallSlots</td><td>R0-R8</td><td>защита и слоты брони Странника</td></tr>
<tr><td>upgradeR1FuelRealmiteIngots, coreForgeStones, coreShadowSpeed, upgradeR8Spirits, crownArcanaDamage</td><td>16; 8/12/8/8; 3; 1; 2</td><td>броня Странника (<a href="../../09-systems/9-4-bronya-strannika-i-nakovalnya/">9.4</a>)</td></tr>
<tr><td>melee.*</td><td>-</td><td>подвиды оружия (<a href="../../08-items/8-1-obychnyy-mir-i-ad/">8.1</a>), melee.pvp - в бою с игроками</td></tr>
<tr><td>enchants.* <span class="tag">Новое</span></td><td>все включены; номера 120-124</td><td>свои зачарования аддона (<a href="../../09-systems/9-13-altar-porchi/">9.13</a>): enabled - есть ли зачарование вообще, id - номер, остальное - числа. Проверка: с мечом в руке <code>/enchant &lt;игрок&gt; 120</code> Размах, <code>121 1-3</code> Ловкость, <code>122</code> Мощь, <code>123</code> Венец, <code>124</code> Озлобление; книга - <code>/give &lt;игрок&gt; enchanted_book 1 0 {StoredEnchantments:[{id:121s,lvl:3s}]}</code></td></tr>
<tr><td>blitzDustPerShot, jungleDebuffSpeed, netherSmeltChance, bedrockStanceTicks</td><td>5, 2, 25%, 2 с/5 с</td><td>оружие и сеты (8.1, 8.2)</td></tr>
<tr><td>skythernGust, mortumSoulChance, miniBosses, miniBossMinutes</td><td>true, 25%, true, 20</td><td>погода и мини-боссы (7.6, 7.7)</td></tr>
<tr><td>arcanaChests, arcanaChestChance, arcanaChestPity, arcanaChestRegion</td><td>-</td><td>сундуки Арканы (<a href="../../04-nether_end_arcana/4-4-arkana-vhod-bossy-sunduki/">4.4</a>)</td></tr>
<tr><td>reliquaries, reliquaryChance, reliquaryShipChance, skythernShipRarity, cloudIslandRarity</td><td>-</td><td>реликварии, корабли, облачные острова</td></tr>
<tr><td>liopleurodonBoss, liopleurodonHealth</td><td>true, 600</td><td>Лиоплевродон (<a href="../../03-overworld/3-6-lioplevrodon/">3.6</a>)</td></tr>
<tr><td>fishSchools, fishingRelics</td><td>true</td><td>рыбалка</td></tr>
<tr><td>corruptAltar, altarRevealCost, altarTopLevels, altarBook*, altarRevealItems</td><td>-</td><td>алтарь порчи (<a href="../../09-systems/9-13-altar-porchi/">9.13</a>)</td></tr>
<tr><td>smeltNoFortune</td><td>рупий, арлемит</td><td>автоплавка инструментов других модов без удачи</td></tr>
<tr><td>accessoriesOnBody, ammoCountOnIcon (клиент)</td><td>true</td><td>аксессуары на теле, цифра патронов</td></tr>
<tr><td>dungeonSpawners, divineTorchRadius, arcanePotionIds</td><td>false, 24</td><td>спавнеры в постройках, факелы, номера эффектов зелий</td></tr>
</table>

Там же - белый список мобов для миров Divine и белый список вещей для Везеи. Подвиды оружия Везеи - разделы melee.claw и melee.hammer.

## Приваты и защита от дюпов

- <b>Эффекты на существ</b> (жители, животные, питомцы) от оружия, брони, аксессуаров и призывов аддона проверяет сам плагин привата пробным ударом от имени того, кто отвечает за удар (хозяин питомца или призыва, стрелок). Поэтому кровотечение, огонь, яд, замедление, обморожение, запрет лечения, вампиризм, гарпуны, Аттрактор Арканы, Томагавк и диски Везеи в чужом регионе их не трогают. Игроков - по флагу pvp региона (плагин приватов читается и на гибридных серверах).
- <b>Не в чужом привате</b>: набрать ведром Лету и воду мечтаний, посадить морковь мечтаний, отмыть краску в котле, зажечь Водный факел зова или жаровню, сделать костёр точкой возрождения. Карманный магнит и Паратику не берут предметы из чужого региона и чужую долю добычи босса. Ставить блоки предметами аддона нельзя и в защите спавна, и там, где плагин запретил строить (setBuild(false)).
- <b>Постройки рядом с логовами</b>: новый сумеречный портал на той стороне (и на обратном пути в обычный мир, где он встаёт по тем же координатам, часто в чьей-то базе) не строится в чужом привате и защите спавна - место сдвигается к ближайшему, где игроку можно строить. Нора Карцинуса засыпает песком только свой проход, Повелитель ветров не сносит постройки, Вечный лучник рушит только колонны своей галереи, молнии боссов блоки не поджигают.
- <b>Если сервер нельзя спросить</b> (другое ядро) - установка блоков и эффекты на игроков и мирных запрещаются, а не разрешаются; в логе об этом одна строка. На сервере без плагинов моды приватов спрашиваются пробными событиями "поставить" и "сломать".
- <b>Дюпы закрыты</b>: печи Divine с ролями считают бонус только за настоящую плавку; алтарь наполнения Везеи берёт плату ровно в момент, когда результат забирают, и в слот результата ничего не положить; свисток питомцев даёт за отпущенного питомца одно яйцо и только с ним внутри; каждый сундук Айсики заполняется один раз, поставленные игроками - никогда; кольцо и Твёрдая рука возвращают только потраченную стрелу; временное облако Посоха облаков, Колдовской лёд босса и Подозрительный песчаник гробницы Шёлковым касанием не забрать; предел монет Джека переживает смерть.
