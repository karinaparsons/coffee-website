var LANDA = LANDA || {};

LANDA.Misc = function(){}

LANDA.Misc.prototype = {

	/**
	 * relies on an element with id = messageModal in the html, in order to work
	 */
	openDialogMessage : function(message, title) {
		var dialog = jQuery("#messageModal");
		if(!title) {
			title = "Ooops...";
		}
		dialog.find(".modal-header h3").html(title);
		dialog.find(".modal-body p").html(message);
		dialog.modal();
	},
	/**
	 * relies on an element with id = confirmModal in the html, in order to work
	 */
	openDialogConfirm : function(message, callback, confirmSelectorId) {
		var modalId = "#confirmModal";
		if(typeof(confirmSelectorId) != 'undefined')
			modalId = confirmSelectorId;
		var dialog = jQuery(modalId);
		if(typeof(message) != 'undefined' && message != null)
			dialog.find(".modal-body p").html(message);
		dialog.modal();
		dialog.find(".modal-footer button.btn-primary").off("click").on("click", function() {
			dialog.modal("hide");
			callback(true);
		});
		dialog.find("[data-dismiss=modal]").off("click").on("click", function() {
			callback(false);
		});
	},
	

	/**
	 * relies on an element with id = htmlId in the html, in order to work
	 */
	openCustomDialogConfirm : function(htmlId, message, callback) {
		var dialog = jQuery("#" + htmlId);
		
		if(message != null)
			dialog.find(".modal-body p").html(message);
		
		dialog.modal();
		dialog.find(".modal-footer button.btn-primary").off("click").on("click", function() {
			dialog.modal("hide");
			callback(true);
		});
		dialog.find("[data-dismiss=modal]").off("click").on("click", function() {
			callback(false, jQuery(this));
		});
	},

	/**
	 * relies on an element with id = htmlId in the html, in order to work
	 */
	openCustomDialog: function(htmlId, message, messageContainerId, primaryLbl, dismissLbl, hidePopupOnPrimary, callback) {
		var dialog = jQuery("#" + htmlId);
		if(messageContainerId && messageContainerId != null && message && message != null){
			dialog.find(".modal-body #" + messageContainerId).html(message);
		}
		
        var errorMsg = dialog.find('p.alertMsg');
        errorMsg.hide();
        errorMsg.html( "" );
        
		dialog.modal();
		dialog.find(".modal-footer button.btn-primary").html(primaryLbl);
		dialog.find(".modal-footer button.btn-primary").off("click").on("click", function() {
			if(hidePopupOnPrimary){
				dialog.modal("hide");
			}
			callback(true);
		});
		if(dismissLbl){
			dialog.find(".modal-footer [data-dismiss=modal]").show();
			dialog.find(".modal-footer [data-dismiss=modal]").html(dismissLbl);
			dialog.find(".modal-footer [data-dismiss=modal]").off("click").on("click", function() {
				callback(false);
			});
		}else{
			dialog.find(".modal-footer [data-dismiss=modal]").hide();
		}
		dialog.find(".modal-header [data-dismiss=modal]").off("click").on("click", function() {
			callback(false);
			dialog.modal("hide");
		});
	},

	hide : function($element){
		$element.addClass('hide'); //twitter bootstrap hide
	},
	show : function($element){
		$element.removeClass('hide'); //twitter bootstrap show
	},
	toggle : function($element){
		var thisObj = this;
		if( thisObj.isHidden( $element ) ){
			thisObj.show($element);
		} else {
			thisObj.hide($element);
		}
	},
	isHidden : function($element){
		return $element.hasClass('hide'); //if is hidden using twitter bootstrap
	},
	enable : function($element, enable){
		if( !enable ){
			$element.attr('disabled', 'disabled');
		}
		else{
			$element.removeAttr('disabled');
		}
	},
	getCookie: function(name) {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) {
			return parts.pop().split(";").shift();
		}
	}
}