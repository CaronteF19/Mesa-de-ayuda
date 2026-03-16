<?php

/**
 * ---------------------------------------------------------------------
 *
 * GLPI - Gestionnaire Libre de Parc Informatique
 *
 * http://glpi-project.org
 *
 * @copyright 2015-2025 Teclib' and contributors.
 * @copyright 2003-2014 by the INDEPNET Development Team.
 * @licence   https://www.gnu.org/licenses/gpl-3.0.html
 *
 * ---------------------------------------------------------------------
 *
 * LICENSE
 *
 * This file is part of GLPI.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * ---------------------------------------------------------------------
 */

namespace Glpi\Dashboard\Filters;

use Html;

class DatesModFilter extends AbstractFilter
{
    public static function getName(): string
    {
        return __("Last update");
    }

    public static function getId(): string
    {
        return "dates_mod";
    }

    public static function canBeApplied(string $table): bool
    {
        /** @var \DBmysql $DB */
        global $DB;

        return $DB->fieldExists($table, 'date_mod');
    }

    public static function getCriteria(string $table, $value): array
    {
        if (!is_array($value) || count($value) !== 2) {
            // Empty filter value
            return [];
        }

        return [
            'WHERE' => self::getDatesCriteria("$table.date_mod", $value)
        ];
    }

    public static function getSearchCriteria(string $table, $value): array
    {
        if (!is_array($value) || count($value) !== 2) {
            // Empty filter value
            return [];
        }

        $date_mod_option_id = self::getSearchOptionID($table, "date_mod", $table);

        return [
            self::getDatesSearchCriteria($date_mod_option_id, $value, 'begin'),
            self::getDatesSearchCriteria($date_mod_option_id, $value, 'end'),
        ];
    }

    public static function getHtml($value): string
    {
        $values = is_array($value)
            ? $value
            : [] // can be a string if values are not initialized yet
        ;

        $rand  = mt_rand();
        $label = self::getName();
        $field = Html::showDateField('filter-dates', [
            'value'        => $values,
            'rand'         => $rand,
            'range'        => true,
            'display'      => false,
            'calendar_btn' => false,
            'placeholder'  => $label,
            'on_change'    => "on_change_{$rand}(selectedDates, dateStr, instance)",
        ]);

        $js = <<<JAVASCRIPT
            var on_change_{$rand} = function(selectedDates, dateStr, instance) {
                // we are waiting for empty value or a range of dates,
                // don't trigger when only the first date is selected
                var nb_dates = selectedDates ? selectedDates.length : 0;
                
                // Validar que realmente tengamos un rango completo (2 fechas diferentes)
                var is_complete_range = false;
                if (nb_dates == 2 && selectedDates[0] && selectedDates[1]) {
                    // Verificar que las fechas sean diferentes (no el mismo día seleccionado dos veces)
                    var date1 = new Date(selectedDates[0]);
                    var date2 = new Date(selectedDates[1]);
                    date1.setHours(0, 0, 0, 0);
                    date2.setHours(0, 0, 0, 0);
                    is_complete_range = (date1.getTime() !== date2.getTime());
                }
                
                // Solo guardar y recargar cuando se haya completado el rango (2 fechas diferentes)
                // o se haya limpiado completamente (0 fechas)
                // NO recargar cuando solo se selecciona la primera fecha (nb_dates == 1)
                // NO recargar si las dos fechas son iguales (selección accidental)
                if (is_complete_range) {
                    Dashboard.getActiveDashboard().saveFilter('dates_mod', selectedDates);
                    $(instance.input).closest("fieldset").addClass("filled");
                } else if (nb_dates == 0) {
                    // Solo limpiar si realmente se limpió el filtro completamente
                    Dashboard.getActiveDashboard().saveFilter('dates_mod', []);
                    $(instance.input).closest("fieldset").removeClass("filled");
                }
                // Si nb_dates == 1 o las fechas son iguales, no hacer nada
                // (primera fecha seleccionada, esperando la segunda, o selección incompleta)
            };
JAVASCRIPT;
        $field .= Html::scriptBlock($js);

        return self::field('dates_mod', $field, $label, is_array($values) && count($values) > 0);
    }
}
