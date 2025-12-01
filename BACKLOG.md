# Handball 2026 - Product Backlog

## ✅ Completat

### Dashboard & Navigation
- [x] Dashboard amb partits pendents i passats
- [x] Navegació entre Dashboard i Match Tracker
- [x] Capçalera de navegació al Match Tracker

### Equips i Jugadors
- [x] Gestió d'equips (CRUD)
- [x] Gestió de jugadors (CRUD)
- [x] Assignació de jugadors als equips
- [x] Indicador "My Team" amb estrella

### Match Tracking
- [x] Match Tracker amb dades reals de l'API
- [x] Càrrega dinàmica de jugadors dels equips
- [x] Registre de tirs amb zona de porteria
- [x] Registre de tirs aturats (Save) amb zona de porteria

### Gestió de Porters i Estadístiques
- [x] Camp `isGoalkeeper` al model Player i `activeGoalkeeperId` a GameEvent
- [x] Badge "GK" a les llistes de jugadors i estadístiques
- [x] Selecció de porter rival al Match Tracker
- [x] Estadístiques específiques de porter (Parades, Eficiència de parades)
- [x] Heatmap de parades per a porters
- [x] Tests unitaris i d'integració per a funcionalitat de porters

---

## 📋 Backlog per Prioritat

### 🔥 Alta Prioritat

#### 1. Edició de Jugades (Match Event Editing)
- [ ] Crear pàgina "Editar Jugades" per llistar i editar totes les accions del partit
- [ ] Afegir icona d'edició al Llistat de Partits
- [ ] Afegir icona d'edició al Match Tracker (pantalla de partit)
- [ ] Implementar funcionalitat d'actualització (canviar tipus, jugador, zona, etc.)

#### 2. Categories d'Equips
- [ ] Afegir camp `category` al model `Team`
  - Opcions: Benjamí, Aleví, Infantil, Cadet, Juvenil, Senior
- [ ] Actualitzar formulari de creació/edició d'equips
- [ ] Mostrar categoria a la llista d'equips

#### 2. Millores a la Llista d'Equips
- [ ] Mostrar: Club + Categoria + Nom de l'equip
- [ ] Afegir caixa de cerca/filtre
- [ ] Permetre filtrar per club, categoria i nom

#### 3. Millores a la Llista de Jugadors
- [ ] Mostrar nom del club del jugador

---

### 🎯 Prioritat Mitjana

#### 4. Millora en Creació de Partits
- [ ] Substituir dropdown per caixa de cerca
- [ ] Permetre buscar per club (mostrar equips del club)
- [ ] Permetre buscar per nom d'equip
- [ ] Excloure equip seleccionat de la segona selecció (evitar mateix equip vs mateix equip)

---

### 🔐 Autenticació i Autorització (Futura versió)

#### 5. Sistema d'Autenticació
- [ ] Implementar Login/Register amb Google OAuth
- [ ] Crear sistema de rols: Admin i User

#### 6. Gestió d'Usuaris
- [ ] Usuaris normals veuen només els seus equips/jugadors
- [ ] Usuaris pertanyen a un club i hereten equips del club
- [ ] Usuaris poden crear equips propis i assignar jugadors

#### 7. Permisos d'Administrador
- [ ] Admins veuen totes les pestanyes i funcionalitats
- [ ] Admins poden gestionar tots els usuaris
- [ ] Admins poden veure quins equips gestiona cada usuari
- [ ] Admins poden assignar funcionalitats als usuaris

#### 8. Sistema de Permisos
- [ ] Crear llista de funcionalitats assignables
- [ ] Permetre assignar funcionalitats específiques als usuaris

#### 9. Vista Personalitzada per Usuari
- [ ] Filtrar partits, equips i dades segons l'usuari autenticat
- [ ] Dashboard personalitzat amb només les dades de l'usuari

---

## 💡 Idees Futures
- [ ] Exportar estadístiques a PDF/Excel
- [ ] Comparació d'estadístiques entre partits
- [ ] Gràfics de rendiment per jugador
- [ ] Notificacions push per partits propers
- [ ] Mode offline amb sincronització
