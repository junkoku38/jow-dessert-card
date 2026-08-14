# Dessert Card — Carte Lovelace

Carte d'affichage du dessert du jour pour l'intégration [Jow Dessert](https://github.com/junkoku38/jow-dessert).

## Installation

1. Ajoutez `https://github.com/junkoku38/jow-dessert-card` dans HACS → Frontend → Dépôts personnalisés
2. Installez "Dessert du jour (jow)"
3. Ajoutez la carte dans votre dashboard :

```yaml
type: custom:dessert-card
entity: sensor.dessert_du_jour
suggest_service: jow_dessert.suggest
clear_service: jow_dessert.clear
set_covers_service: jow_dessert.set_covers
```

## Configuration

| Champ | Description | Défaut |
|-------|-------------|--------|
| `entity` | Capteur du dessert du jour | `sensor.dessert_du_jour` |
| `suggest_service` | Service de suggestion IA | `jow_dessert.suggest` |
| `clear_service` | Service d'effacement | `jow_dessert.clear` |
| `set_covers_service` | Service changement parts | `jow_dessert.set_covers` |
| `show_calories` | Afficher les calories | `true` |