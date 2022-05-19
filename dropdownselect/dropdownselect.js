(function( $ ){
    $.fn.dropdownselect = function(action) {
        if (typeof action == "undefined") {
            this.each(function(){
                if ($(this).hasClass('dropdown-select-hidden') || $(this).attr('dropdown-select-id')) {
                    return console.error('Cannot reinitiate dropdownselect!');
                }

                id = 'dropdown-select-' + (Math.random().toString(36).substr(2, 10));
                $(this).attr('dropdown-select-id', id);
                $(this).addClass('dropdown-select-hidden');

                const required = $(this).attr('required');
                const multiple = $(this).attr('multiple');
                const placeholder = $(this).attr('placeholder');
                const hideSelectAll = $(this).attr('hide-select-all');
                const optionsHeight = $(this).attr('options-height');

                let dropdownselectoptions = '';
                $(this).find('option').each(function(){
                    const value = $(this).val();
                    const text = $(this).html();
                    dropdownselectoptions += '<label>' +
                            '<input class="dropdown-select-option-value" type="'+(multiple ? 'checkbox' : 'radio')+'" value="'+value+'">'+
                            '<span class="dropdown-select-option-text">'+text+'</span>'+
                        '</label>';
                });

                let dropdownselectobject = '<div class="dropdown dropdown-select" id="'+id+'">'+
                '<input class="form-select d-block dropdown-select-text" value="" placeholder="'+(placeholder ? placeholder : '')+'" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false"' + (required ? ' required' : '') +'>'+
                '<div class="dropdown-menu w-100 p-3">'+
                    '<div class="d-flex border rounded overflow-hidden mb-3">';
                if (multiple && !hideSelectAll) {
                    dropdownselectobject += '<label class="input-group-text px-3">'+
                        '<input class="dropdown-select-all" type="checkbox">'+
                        '<span class="dropdown-select-option-text">All</span>'+
                    '</label>';
                }
                dropdownselectobject += '<input type="text" class="border-0 w-100 px-3 py-1 dropdown-select-search" placeholder="Search option">'+
                    '</div>'+
                    '<div class="dropdown-select-options px-3"'+(optionsHeight ? ' style="height:'+optionsHeight+'"' : '')+'>';
                dropdownselectobject += dropdownselectoptions;
                dropdownselectobject += '</div></div></div>';

                $(this).after(dropdownselectobject);
                $(this).dropdownselect('refresh');
            });
        } else if (action == 'destroy') {
            this.each(function(){
                if ($(this).hasClass('dropdown-select-hidden')) {
                    $(this).removeClass('dropdown-select-hidden');
                }
                if ($(this).attr('dropdown-select-id')) {
                    $('#'+$(this).attr('dropdown-select-id')).remove();
                    $(this).removeAttr('dropdown-select-id');
                }
            });
        } else if (action == 'refresh') {
            this.each(function(){
                const id = $(this).attr('dropdown-select-id');
                let selected_text = [];
                $(this).find('option').each(function(){
                    const value = $(this).val();
                    const text = $(this).html();
                    const checked = $(this).is(':selected');
                    if (checked) selected_text.push(text);
                    $('#'+id+' .dropdown-select-option-value[value="'+value+'"]').prop('checked', checked);
                });

                let selectedAbbrCount = $('select[dropdown-select-id="'+id+'"]').attr('selected-count') ? $('select[dropdown-select-id="'+id+'"]').attr('selected-count') : 3;
                let selectedAbbrText = $('select[dropdown-select-id="'+id+'"]').attr('selected-text') ? $('select[dropdown-select-id="'+id+'"]').attr('selected-text') : '{NUM} items selected';
                let limit = parseInt($('select[dropdown-select-id="'+id+'"]').attr('limit'));

                $('#'+id+' .dropdown-select-text').val(selected_text.length > selectedAbbrCount ? selectedAbbrText.replace('{NUM}', selected_text.length) : selected_text.join(', '));
                const selectAllObj = $(this).parents('.dropdown-select').find('.dropdown-select-all');

                if (limit) {
                    $('.dropdown-select-option-value').prop('disabled', false);
                    if (selected_text.length >= limit) {
                        $('.dropdown-select-option-value:not(:checked)').prop('disabled', true);
                    }
                }

                if (selected_text.length == $(this).find('option').length) {
                    $('#'+id+' .dropdown-select-all').prop('checked', true).prop('indeterminate', false);
                } else if (selected_text.length > 0) {
                    $('#'+id+' .dropdown-select-all').prop('checked', false).prop('indeterminate', true);
                } else {
                    $('#'+id+' .dropdown-select-all').prop('checked', false).prop('indeterminate', false);
                }
            });

        } else if (action == 'selectAll') {
            this.each(function(){
                $(this).find('option').attr('selected', 'selected');
                $(this).dropdownselect('refresh');
            });
        } else if (action == 'deselectAll') {
            this.each(function(){
                $(this).find('option').removeAttr('selected')
                $(this).dropdownselect('refresh');
            });
        } else {
            console.error('Unknown dropdownselect command!');
        }
    };
 })( jQuery );

$(document).on('click', '.dropdown-select-text', function(){
    $(this).parents('.dropdown-select').find('.dropdown-select-search').focus();
});

$(document).on('keypress', '.dropdown-select-text', function(e) {
    e.preventDefault();
    return false;
});

$(document).on('change', '.dropdown-select-all', function(){
    const id = $(this).parents('.dropdown-select').attr('id');
    if ($(this).is(':checked')) {
        $('[dropdown-select-id="'+id+'"]').dropdownselect('selectAll');
    } else {
        $('[dropdown-select-id="'+id+'"]').dropdownselect('deselectAll');
    }
});

$(document).on('change', '.dropdown-select-options .dropdown-select-option-value', function(){
    if ($(this).attr('type') == 'radio') {
        $(this).parents('.dropdown-select-options').find('.dropdown-select-option-value').prop('checked', false);
        $(this).prop('checked', true);
    }
    const id = $(this).parents('.dropdown-select').attr('id');
    if ($(this).is(':checked')) {
        $('[dropdown-select-id="'+id+'"] option[value="'+$(this).val()+'"]').attr('selected', 'selected');
    } else {
        $('[dropdown-select-id="'+id+'"] option[value="'+$(this).val()+'"]').removeAttr('selected');
    }
    $('[dropdown-select-id="'+id+'"]').dropdownselect('refresh');
});

$(document).on('keyup', '.dropdown-select-search', function(e) {
    const search = $(this).val().toLowerCase();
    $(this).parents('.dropdown-select').find('.dropdown-select-option-text').each(function(){
        if ($(this).html().toLowerCase().includes(search)) {
            $(this).parents('.dropdown-select-options label').show();
        } else {
            $(this).parents('.dropdown-select-options label').hide();
        }
    });
});
