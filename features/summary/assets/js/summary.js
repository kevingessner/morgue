/**
 * get the raw markdown summary and display it in a textedit area instead of
 * the rendered HTML
 * param: optional text to append to the textedit area
 */
function make_summary_editable(text) {
    var $summary = $("#summary");

    if (typeof text !== "string") {
        text = '';
    } else {
        text = "\n"+text;
    }

    // if a textarea already, append to it
    if ($summary.is('textarea')) {
        $summary.val(function(index, value){
                return value + text;
            });

        // if not a textarea already, create one and replace the original div with it
    } else {
        $.getJSON(
                  "/events/"+get_current_event_id()+"/summary",
                  function(data) {
                      var textarea = $("<textarea></textarea>")
                          .attr({
                                  "id": "summary",
                                  "name": "summary",
                                  "class": "input-xxlarge editable",
                                  "rows": "10"
                              })
                          .val(data.summary + text);
                      $summary.replaceWith(textarea);
                      $("#summary").on("save", summary_save);
                  },
                  'json' // forces return to be json decoded
                  );
    }
}

function update_summary_for_event() {
    var url = "/events/" + get_current_event_id();
    $.ajax({
            url: url,
            data: {
                   summary: $("#summary").val()
                  },
            type: "PUT"
          });
}

/**
 * Depending on the current state either show the editable summary form or
 * save the markdown summary and render as HTML
 */
function summary_save() {
    update_summary_for_event();
    var html = $("<div></div>");
    html.attr("id", "summary");
    html.attr("name", "summary");
    html.attr("class", "input-xxlarge editable");
    html.attr("rows", "10");
    html.html(markdown.toHTML($("#summary").val()));
    $("#summary").remove();
    $("#summarywrapper").append(html);
    $("#summaryundobutton").hide();
    $("#summary").on("edit", make_summary_editable);
}

/**
 * just abort editing and display the stored data as rendered HTML
 */
function summary_undo_button() {
    $.getJSON("/events/"+get_current_event_id()+"/summary", function(data) {
            $('#summary').val(data.summary);
        });
}

$("#summary").on("edit", make_summary_editable);
$("#summaryundobutton").on("click", summary_undo_button);
$.getJSON("/events/"+get_current_event_id()+"/summary", function(data) {
    $("#summary").html(markdown.toHTML(data.summary));
});

