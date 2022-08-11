(function( $ ){
    var options = {};

    function getSelectedUID(id) {
        let selected = [];

        $('[dropdown-select-id="'+id+'"] [dds-uid]').each(function(idx, ddsItem){
            if ($(ddsItem).is(':selected')) {
                selected.push($(ddsItem).attr('dds-uid'));
            }
        });

        return selected;
    }

    function renderDSOptions(id, data) {
        let html = '';
        const selected = getSelectedUID(id);
        const multiple = $('[dropdown-select-id="'+id+'"]').attr('multiple');

        for (key in data) {
            const option = data[key];
            if (option.text) {
                if (option.child) {
                    html += '<div class="-dds-group">'+
                        '<div class="-dds-item">' +
                            '<a class="-dds-expand" data-bs-toggle="collapse" href="#child-' + option.ddsUID + '" role="button"><i class="fa fa-chevron-right"></i></a>' +
                            '<label>' +
                                (multiple ? '<input class="-dds-value -dds-group-parent" dds-target-uid="' + option.ddsUID + '" type="checkbox" '+ (option.value && option.value !== null ? 'value="' + option.value + '"' : '') + (selected.includes(option.ddsUID) ? ' checked' : '') + '>' : '')+
                                '<span class="-dds-text">'+option.text+'</span>'+
                            '</label>'+
                        '</div>'+
                        '<div class="-dds-group-child collapse show" id="child-' + option.ddsUID + '">' + renderDSOptions(id, option.child) + '</div>' +
                    '</div>';
                } else {
                    html += '<div class="-dds-item">' +
                        '<label>'+
                            '<input class="-dds-value" dds-target-uid="' + option.ddsUID + '" type="'+(multiple ? 'checkbox' : 'radio')+'" '+ (option.value && option.value !== null ? 'value="' + option.value + '"' : '') + (selected.includes(option.ddsUID) ? ' checked' : '') + '>'+
                            '<span class="-dds-text">'+option.text+'</span>'+
                        '</label>'+
                    '</div>';
                }
            }
        }
        return html;
    }

    function renderRealOptions(data) {
        html = '';
        for (key in data) {
            const option = data[key];
            if (option.text) {
                option.ddsUID = (Math.random().toString(36).substr(2, 10));
                if (option.child) {
                    if (option.value) {
                        html += '<option dds-uid="' + option.ddsUID + '" '+ (option.value && option.value !== null ? 'value="' + option.value + '"' : '') + '>'+option.text+'</option>';
                        html += renderRealOptions(option.child);
                    } else {
                        html += '<optgroup dds-uid="' + option.ddsUID + '" '+ (option.value && option.value !== null ? 'value="' + option.value + '"' : '') + ' label="'+option.text+'">';
                        html += renderRealOptions(option.child);
                        html += '</optgroup>';
                    }
                } else {
                    html += '<option dds-uid="' + option.ddsUID + '" value="'+option.value+'">'+option.text+'</option>';
                }
            }
        }
        return html;
    }

    function searchOption(data, keyword) {
        let filteredData = [];
        for (key in data) {
            const option = data[key];
            if (option.child) {
                let filteredChilds = searchOption(option.child, keyword);
                if (filteredChilds.length > 0) {
                    option.child = filteredChilds;
                    filteredData.push(option);
                } else {
                    if (option.text && option.value && option.text.toLowerCase().includes(keyword)) {
                        filteredData.push({
                            text: option.text,
                            value: option.value
                        });
                    }
                }
            } else {
                if (option.text && option.text.toLowerCase().includes(keyword)) {
                    filteredData.push(option);
                }
            }
        }

        return filteredData;
    }

    function generatePlaceholder(id, data) {
        let text = [];
        const selected = getSelectedUID(id);
        const groupSelect = $('[dropdown-select-id="'+id+'"]').attr('group-placeholder');
        for (key in data) {
            const option = data[key];
            if (option.child) {

                let selectedChilds = generatePlaceholder(id, option.child);
                if (groupSelect) {
                    let childsText = [];
                    for (okey in option.child) {
                        childsText.push(option.child[okey].text);
                    }
                    if (JSON.stringify(selectedChilds) == JSON.stringify(childsText)) {
                        selectedChilds = [option.text];
                    }
                } else {
                    if (selected.includes(option.ddsUID)) {
                        text.push(option.text);
                    }
                }

                for (ckey in selectedChilds) {
                    text.push(selectedChilds[ckey]);
                }
            } else {
                if (selected.includes(option.ddsUID)) {
                    text.push(option.text);
                }
            }
        }
        return text;
    }

    $.fn.dropdownselect = function(action, param) {
        const id = $(this).attr('dropdown-select-id');
        switch (action) {
            case 'destroy':
                this.each(function(){
                    if ($(this).hasClass('-dds-hidden')) {
                        $(this).removeClass('-dds-hidden');
                    }
                    if ($(this).attr('dropdown-select-id')) {
                        $('#'+$(this).attr('dropdown-select-id')).remove();
                        $(this).removeAttr('dropdown-select-id');
                    }
                });
                break;
            case 'selectAll':
                if (id) {
                    $('#'+id+ ' .-dds-select-all').prop('checked', true);
                    $('[dropdown-select-id="'+id+'"] option').attr('selected', 'selected');
                    $('[dropdown-select-id="'+id+'"]').trigger('change').dropdownselect('refresh');
                    return;
                }
                console.error('Not a dropdownselect object');
                break;
            case 'deselectAll':
                if (id) {
                    $('#'+id+ ' .-dds-select-all').prop('checked', false);
                    $('[dropdown-select-id="'+id+'"] option').removeAttr('selected');
                    $('[dropdown-select-id="'+id+'"]').trigger('change').dropdownselect('refresh');
                    return;
                }
                console.error('Not a dropdownselect object');
                break;
            case 'getOptions':
                return id ? options[id] : console.error('Not a dropdownselect object');
            case 'search':
                this.each(function(){
                    const id = $(this).attr('dropdown-select-id');
                    const filtered = searchOption(JSON.parse(JSON.stringify(options[id])), param);
                    $('#' + id + ' .-dds-data').html(filtered.length > 0 ? renderDSOptions(id, filtered) : '<div class="-dds-not-found">No matches found</div>');
                });
                break;
            case 'refresh':
                this.each(function(){
                    // update option selected and dds-value checked
                    $('[dropdown-select-id="'+id+'"]').children().each(function(idx, child) {
                        if ($(child).is('optgroup')) {
                            $(child).find('option').each(function(cidx, option){
                                const uid = $(option).attr('dds-uid');
                                $('[dds-target-uid="'+uid+'"]').prop('checked', $(option).is(':selected'));
                                if ($(option).is(':selected')) {
                                    $(option).attr('selected', 'selected');
                                } else {
                                    $(option).removeAttr('selected');
                                }
                            });
                        } else if ($(child).is('option')) {
                            const uid = $(child).attr('dds-uid');
                            $('[dds-target-uid="'+uid+'"]').prop('checked', $(child).is(':selected'));
                            if ($(child).is(':selected')) {
                                $(child).attr('selected', 'selected');
                            } else {
                                $(child).removeAttr('selected');
                            }
                        }
                    });

                    // update select all
                    if ($('#'+id+' .-dds-value:not(:checked)').length > 0) {
                        if ($('#'+id+' .-dds-value:checked').length > 0) {
                            $('#'+id+' .-dds-select-all').prop('checked', false).prop('indeterminate', true);
                        } else {
                            $('#'+id+' .-dds-select-all').prop('indeterminate', false).prop('checked', false);
                        }
                    } else {
                        $('#'+id+' .-dds-select-all').prop('indeterminate', false).prop('checked', true);
                    }

                    $('#'+id+ ' .-dds-value').prop('indeterminate', false);

                    // update group parent checked
                    $('#'+id+ ' .-dds-value:checked').each(function(idx, option){
                        $(option).parents('.-dds-group').each(function(cidx, group) {
                            let parentCB = $(group).find('.-dds-group-parent');
                            parentCB = $(parentCB[0]);
                            if (!parentCB.prop('checked') || !parentCB.prop('indeterminate')) {
                                if ($(group).find('.-dds-group-child .-dds-value:not(:checked)').length > 0) {
                                    if ($(group).find('.-dds-group-child .-dds-value:checked').length > 0) {
                                        parentCB.prop('checked', false).prop('indeterminate', true);
                                    } else {
                                        parentCB.prop('indeterminate', false).prop('checked', false);
                                    }
                                } else {
                                    parentCB.prop('indeterminate', false).prop('checked', true);
                                }
                            }
                        });
                    });

                    // set placeholder from selected values
                    const selectedAbbrCount = $('[dropdown-select-id="'+id+'"]').attr('selected-count') ? $('[dropdown-select-id="'+id+'"]').attr('selected-count') : 4;
                    const selectedAbbrText = $('[dropdown-select-id="'+id+'"]').attr('selected-text') ? $('[dropdown-select-id="'+id+'"]').attr('selected-text') : '{NUM} items selected';
                    const placeholders = generatePlaceholder(id, options[id]);
                    $('#' + id + ' .-dds-placeholder').val(selectedAbbrCount > 0 && placeholders.length >= selectedAbbrCount ? selectedAbbrText.replace('{NUM}', placeholders.length) : placeholders.join(', ').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));

                });
                break;
            case 'onDropdownShow':
                this.each(function(){
                    $('#' + id).on('show.bs.dropdown', () => param());
                });
                break;
            case 'onDropdownShown':
                this.each(function(){
                    $('#' + id).on('shown.bs.dropdown', () => param());
                });
                break;
            case 'onDropdownHide':
                this.each(function(){
                    $('#' + id).on('hide.bs.dropdown', () => param());
                });
                break;
            case 'onDropdownHidden':
                this.each(function(){
                    $('#' + id).on('hidden.bs.dropdown', () => param());
                });
                break;
            default: //initialize
                if (typeof action == "object" || typeof action == "undefined") {
                    this.each(function(){
                        if (!$(this).is('select')) {
                            return console.error('Dropdownselect is only for "select" element');
                        }
                        if ($(this).hasClass('-dds-hidden') || $(this).attr('dropdown-select-id')) {
                            return console.error('Cannot reinitiate dropdownselect!');
                        }

                        const id = 'dropdown-select-' + (Math.random().toString(36).substr(2, 10));
                        $(this).attr('dropdown-select-id', id);
                        $(this).addClass('-dds-hidden');

                        if (typeof action != "object") action = {};

                        const required = action.required || $(this).attr('required');
                        const placeholder = action.placeholder ? action.placeholder : $(this).attr('placeholder');
                        const hideSelectAll = action.hideSelectAll || $(this).attr('hide-select-all');
                        const optionsHeight = action.optionsHeight ? action.optionsHeight : $(this).attr('options-height');

                        if (action.options) {
                            options[id] = action.options;
                            if (required) $(this).attr('required', 'required');
                            if (action.multiple) $(this).attr('multiple', 'multiple');
                            if (action.selectedCount) $(this).attr('selected-count', action.selectedCount);
                            if (action.selectedText) $(this).attr('selected-text', action.selectedText);
                            if (action.groupPlaceholder) $(this).attr('group-placeholder', action.groupPlaceholder);
                            $(this).html(renderRealOptions(options[id]));
                            if (action.defaultValues) {
                                if (!Array.isArray(action.defaultValues)) action.defaultValues = [action.defaultValues];
                                for (key in action.defaultValues) {
                                    $(this).find('option[value="' + action.defaultValues[key] + '"]').attr('selected', 'selected');
                                }
                            }
                        } else {
                            options[id] = [];
                            $(this).children().each(function(idx, child) {
                                itemId = (Math.random().toString(36).substr(2, 10));
                                if ($(child).is('optgroup')) {
                                    const value = $(child).attr('value');
                                    const text = $(child).attr('label');
                                    let item = {
                                        'ddsUID': itemId,
                                        'value': value ? value : null,
                                        'text': text.trim(),
                                        'child': []
                                    }
                                    $(child).find('option').each(function(cidx, option){
                                        itemId = (Math.random().toString(36).substr(2, 10));
                                        const value = $(option).val();
                                        const text = $(option).html();
                                        item['child'].push({
                                            'ddsUID': itemId,
                                            'value': value,
                                            'text': text.trim(),
                                        });
                                        $(option).attr('dds-uid', itemId);
                                    });

                                    options[id].push(item);
                                } else if ($(child).is('option')) {
                                    const value = $(child).val();
                                    const text = $(child).html();
                                    options[id].push({
                                        'ddsUID' : itemId,
                                        'value': value,
                                        'text': text.trim(),
                                    });
                                }
                                $(child).attr('dds-uid', itemId);
                            });
                        }

                        let dropdownselectobject = '<div class="dropdown -dds" id="'+id+'">'+
                        '<input class="form-select d-block -dds-placeholder" value="" onkeydown="return false;" placeholder="'+(placeholder ? placeholder : '')+'" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false"' + (required ? ' required' : '') +'>'+
                        '<div class="dropdown-menu -dds-menu">'+
                            '<div class="-dds-header d-flex border rounded">';
                        if ($(this).attr('multiple') && !hideSelectAll) {
                            dropdownselectobject += '<label class="input-group-text px-3">'+
                                '<input class="-dds-select-all" type="checkbox">'+
                                '<span class="ms-1">All</span>'+
                            '</label>';
                        }
                        dropdownselectobject += '<input type="text" class="-dds-search" placeholder="Search option">'+
                            '</div>'+
                            '<div class="-dds-data"'+(optionsHeight ? ' style="height:'+optionsHeight+'"' : '')+'>' + renderDSOptions(id, options[id]) + '</div>' +
                        '</div>' +
                        '</div>';

                        $(this).after(dropdownselectobject);
                        $(this).dropdownselect('refresh');
                    });
                } else {
                    console.error("Unknown dropdownselect action: " + action);
                }
        }
    };

    /* FOCUS SEARCH WHEN OPEN */
    $(document).on('click', '.-dds .-dds-placeholder', function(){
        $(this).parents('.-dds').find('.-dds-search').focus();
    });

    /* DISABLE KEYPRESS ON DROPDOWN SELECT TEXT */
    $(document).on('keypress', '.-dds .-dds-placeholder', function(e) {
        e.preventDefault();
        return false;
    });

    /* SEARCH OPTIONS */
    $(document).on('keyup', '.-dds .-dds-search', function(e) {
        const id = $(this).parents('.-dds').attr('id');
        $('[dropdown-select-id="'+id+'"]').dropdownselect('search', $(this).val().toLowerCase());
    });

    /* SELECT ALL */
    $(document).on('change', '.-dds .-dds-select-all', function() {
        const id = $(this).parents('.-dds').attr('id');
        if ($(this).is(':checked')) {
            $('[dropdown-select-id="'+id+'"]').dropdownselect('selectAll');
        } else {
            $('[dropdown-select-id="'+id+'"]').dropdownselect('deselectAll');
        }
    });

    /* UPDATE SELECT ON CHECKBOX CHANGE */
    $(document).on('change', '.-dds .-dds-value', function() {
        const id = $(this).parents('.-dds').attr('id');
        const checked = $(this).is(':checked');
        let options = [];

        if ($(this).hasClass('-dds-group-parent')) {
            options = $(this).parent('label').parent('.-dds-item').next('.-dds-group-child').find('.-dds-value');
            options.push($(this));
        } else {
            options = $(this);
        }

        options.each(function(idx, opt){
            const targetUID = $(opt).attr('dds-target-uid');
            $(opt).prop('checked', checked);
            if (checked) {
                $('[dropdown-select-id="'+id+'"] [dds-uid="'+targetUID+'"]').attr('selected', 'selected');
            } else {
                $('[dropdown-select-id="'+id+'"] [dds-uid="'+targetUID+'"]').removeAttr('selected');
            }
        });

        $('[dropdown-select-id="'+id+'"]').trigger('change').dropdownselect('refresh');
    });
})( jQuery );
