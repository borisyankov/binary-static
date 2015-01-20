//
//
//
// This script contains various functions used by our forms.
// NOTE: Since you might not find reference to these functions within our javascripts you might delete some stuff from here without cleaning up forms.
//
function clearInputErrorField(id) {
    var errorfield = document.getElementById(id);
    if (errorfield) {
        // we need to create a brand new passage element and replace to the existing one.
        // IE6 does not treat null/empty string as empty innerHTML (which means it will appear at the IE browswer)
        var parentNode = errorfield.parentNode;
        if (parentNode) {
            var passage = document.createElement('p');
            passage.id = errorfield.id;
            passage.className = errorfield.className;
            parentNode.replaceChild(passage, errorfield);
            return passage;
        }
        return errorfield;
    }
}

function swithTabIfError(IsErrorFound)
{
    if (IsErrorFound)
    {
        $('.errorfield').each(function ()
        {
            if (this.innerHTML.length > 0)
            {
                MenuContent.trigger({
                    'content_id': $(this).parents('[id*=-content]').attr('id')
                });
            }
        });
        return 1;
    }
    else
    {
        return 0;
    }
}

