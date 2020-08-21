var mhm = mhm || {};

mhm.Payment = {
	constants : {
		overwrites : {
			coupon : 'startersale',
			defaultPlan : 'dl-monthly-0318',
			always : true,
			//only applies when the first option can't be applied.
			alternate : {
				coupon : 'goannual19',
				defaultPlan : 'dl-annual-0318',
				always : false,
			}
		}
	},
	model : {
		ccNumber : '',
		zip : '',
		ccDate : '',
		ccCvv : '',
		ccFirstName : '',
		ccLastName : '',
		plan : '',
		country : '',
		coupon : '',
		memberId : '-1',
		/* account registration fields when necesary */
		email : '',
		emailConfirm : '',
		password : '',
		organization : '',
		businessType : '',
		restaurantType : ''
	},
	configuration : {
		action : 'upgrade',
		redirectOnClose : null,
		account : {
			createFreeAccountOnClose : false
		},
		onReceiptClose : function(){}
	},
	init : function(){
		
		$('#btnGoToIntroduction').click(function(e){
			e.preventDefault();
			mhm.Payment.ui.showSlide('.pay-introduction');
		})
		
		$('#btnGoToPayment').click(function(e){
			e.preventDefault();
			mhm.Payment.ui.showSlide('.pay-cc-data');
		})
		
		$('.btnGoToAccountForm').click(function(e){
			e.preventDefault();
			mhm.Payment.ui.showSlide('.pay-slide-account-form');
		})
		
		$('.btnGoToLoginForm').click(function(e){
			e.preventDefault();
			mhm.Payment.ui.showSlide('.pay-slide-login-form');
		})
		
		$('#btnLoginAndGoToPayment').click(function(e){
			e.preventDefault();
			$('#loginSpinnerContainer').show();
			mhm.Payment.handlers.login();
		})
		
		/**
		 * Registration and Login - Freemium Registration
		 * this is used on the wizard registration step, whent he wizard is only used for free registration.
		 */
		$('#btnCreateFreemiumAccount').click(function(e){
			e.preventDefault();
			$('#loginSpinnerContainer').show();
			mhm.Payment.handlers.validateAccountRegistrationData(function(){
				//create the free account and go to my menus.
				mhm.Payment.handlers.createFreemiumAccount(function(){
					$('#billing-modal-overlay').addClass('pay-hidden');
					if(typeof(mhm.Payment.flow.close) !== 'undefined'){
						mhm.Payment.flow.close();
					}
				});
			})
			
		})
		
		/**
		 * Registration and Payment - Validate before Paid Registration
		 * this is used on the wizard registration step, to validate the account data before a paid account creation. 
		 */
		$('#btnValidateAccountDataAndGoToPayment').click(function(e){
			e.preventDefault();
			
			mhm.Payment.handlers.validateAccountRegistrationData(function(){
				//create the free account and go to my menus.
				//create a free account if the customer passes the account creation validation and chooses to close the modal.
				mhm.Payment.configuration.account.createFreeAccountOnClose = true;
				mhm.Payment.ui.showSlide('.pay-cc-data');
			
			})
			
		})
		
		$('#payCountry').change(function(){
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		})

		$('#payZip').keyup(function(){
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		})
		
		$('#payZip').mouseup(function(){
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		})
		
		/* handle the coupon validation slowly rather than on each key pressed */
		var couponTypingTimer;                //timer identifier
		var couponDoneTypingInterval = 2000;  //time in ms, 5 second for example
		var $couponInput = $('#payCoupon');

		//on keyup, start the countdown
		$couponInput.on('keyup', function () {
		  clearTimeout(couponTypingTimer);
		  couponTypingTimer = setTimeout(couponDoneTyping, couponDoneTypingInterval);
		});

		//on keydown, clear the countdown 
		$couponInput.on('keydown', function () {
		  clearTimeout(couponTypingTimer);
		});

		//user is "finished typing," do something
		function couponDoneTyping () {
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		}
		
		/*
		$('#payCoupon').keyup(function(){
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		})
		*/
		
		$('#payCoupon').mouseup(function(){
			mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		})
		
		/* here is the code that handles the last action : upgrade for accounts that are free or monthly, paid registration for visitors or ... */
		$('#btnPaySubscribe').click(function(){
			var model = mhm.Payment.model;
			var configuration = mhm.Payment.configuration;
			
			if($('#btnPaySubscribe').hasClass('disabled')){
				return false;
			}
			
			$('#btnPaySubscribe').addClass('disabled');
			
			if(configuration.action === 'upgrade'){
				mhm.Payment.handlers.upgradeToPaidPlan();
			}
			
			if(configuration.action === 'paid-registration'){
				mhm.Payment.handlers.createPaidAccount();
			}
			
			if(configuration.action === 'plan-extension'){
				mhm.Payment.handlers.extendPaidPlan();
			}
		})
		
		$('.plan-row').each(function(){
			
			$check = $(this);
			$check.off('click').click(function(){
				mhm.Payment.selectPlan($(this));
			})
			
			if($check.hasClass('plan-selected')){
				$('#payPlan').val($check.data('plan'));
				$('#payPlanValue').val($(this).data('price'));
				
				$('#payTotal').html($check.data('price').toFixed(2));
			}
		})
		
		$('.pay-close').click(function(){
			mhm.Payment.ui.close();
		})

		mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		
	},
	selectPlan : function($plan){
		
		var overwrites = mhm.Payment.constants.overwrites;
		var hasContent = mhm.Payment.hasContent;
		
		$('.pay-plan-select').removeClass('selected');
		$('.pay-plan-select').closest('.plan-row').removeClass('plan-selected');
		
		$plan.addClass('plan-selected');
		$plan.find('.pay-plan-select').first().addClass('selected');
		
		$('#payPlan').val($plan.data('plan'));
		$('#payPlanValue').val($plan.data('price'));
		
		$('#payTotal').html($plan.data('price').toFixed(2));
		
		//check if there is a coupon set that will not apply to the current plan and remove it.
		if($('#payCoupon').val() !== '' && $('#payCoupon').data('plan') !== $plan.data('plan')){
			$('#payCoupon').val('');
		}
		//check if there is a default coupon set in place for the selected plan that should be always added and add it.
		if(hasContent(overwrites.defaultPlan) && overwrites.defaultPlan === $plan.data('plan') && overwrites.always){
			$('#payCoupon').val(overwrites.coupon);
			$('#payCoupon').data('plan',$plan.data('plan'));
		}else if(hasContent(overwrites.alternate) && hasContent(overwrites.alternate.defaultPlan) && overwrites.alternate.defaultPlan === $plan.data('plan')){
			$('#payCoupon').val(overwrites.alternate.coupon);
			$('#payCoupon').data('plan',$plan.data('plan'));
		}
		mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
		//compute totals
	},
	showValidationErrors : function(errors){
		$('.pay-error').empty();
		$('.pay-error').parent().removeClass('pay-error-ct');
		
		mhm.Payment.showValidationErrorsForField(errors, 'ccNumber', $('.payErrCcNumber'));
		mhm.Payment.showValidationErrorsForField(errors, 'zip', $('.payErrZip'));
		mhm.Payment.showValidationErrorsForField(errors, 'country', $('.payErrCountry'));
		mhm.Payment.showValidationErrorsForField(errors, 'ccCvv', $('.payErrCcCvv'));
		mhm.Payment.showValidationErrorsForField(errors, 'ccDate', $('.payErrCcDate'));
		mhm.Payment.showValidationErrorsForField(errors, 'ccFirstName', $('.payErrCcFirstName'));
		mhm.Payment.showValidationErrorsForField(errors, 'ccLastName', $('.payErrCcLastName'));
	}, 
	showValidationErrorsForField : function(errors, from, $to){
		var hasContent = mhm.Payment.hasContent;
		var messages = mhm.Payment.validationErrorMessages;
		if(hasContent(errors[from])){
			for(var e in errors[from]){
				$to.append($('<span class="pay-error-line">' + messages[from + '.' + e] + '</span>'));
				$to.parent().addClass('pay-error-ct');
			}
		}
	},
	showRecurlyErrors : function(errors){
		$('.pay-error').empty();
		for(var i = 0; i < errors.length; i++){
			if(errors[i].field === 'purchase.account.billing_info.verification_value'){
				$('.payErrCcCvv').append($('<span class="pay-error-line">' + errors[i].message + '</span>'));
			}else{
				$('.payErrGlobal').append($('<span class="pay-error-line">' + errors[i].message + '</span>'));
			}
		}
	},
	showRegistrationValidationErrors : function(errors){
		$('.reg-error').empty();
		$('.reg-error').parent().removeClass('pay-error-ct');
		
		mhm.Payment.showValidationErrorsForField(errors, 'email', $('.regErrEmail'));
		mhm.Payment.showValidationErrorsForField(errors, 'emailConfirm', $('.regErrEmailConfirm'));
		mhm.Payment.showValidationErrorsForField(errors, 'organization', $('.regErrOrganization'));
		mhm.Payment.showValidationErrorsForField(errors, 'password', $('.regErrPassword'));
		mhm.Payment.showValidationErrorsForField(errors, 'businessType', $('.regErrBusinessType'));
		mhm.Payment.showValidationErrorsForField(errors, 'restaurantType', $('.regErrRestaurantType'));
	},
	showLoginValidationErrors : function(errors){
		$('.login-error').empty();
		$('.login-error').parent().removeClass('pay-error-ct');
		mhm.Payment.showValidationErrorsForField(errors, 'email', $('.loginErrEmail'));
		mhm.Payment.showValidationErrorsForField(errors, 'password', $('.loginErrPassword'));
		mhm.Payment.showValidationErrorsForField(errors, 'login', $('.loginErrLogin'));
	},
	
	hasContent : function(property){
		if(typeof(property) !== 'undefined' && property !== ''){
			return true;
		}
		return false;
	},
	calculateTax : function(){
		
		var discount = 0.0;
		try{
			discount = $('#payCoupon').data('discount') / 100;
		}catch(err){
			console.log(err.stack);
		}

		var planValue = parseFloat($('#payPlanValue').val()) - discount;
		$('#payTotal').html((mhm.Payment.roundTo2(planValue)).toFixed(2));

		var transactionData = {
				country : $('#payCountry').find(":selected").val(),
				amount : planValue,
				state : "",
				zip : $('#payZip').val(),
				service : "membership"
		}
		
		if(transactionData.zip !== '' && transactionData.amount !== ''){
			
			$.ajaxSetup({
				contentType: "application/x-www-form-urlencoded; charset=UTF-8"
			});
			$.post('/app/member/billing/tax/get', {data : JSON.stringify(transactionData)}).done(function(resp){
				var tax = "0.00";
				if (!!resp.err) {
					//alert(resp.data);
				}else {
					var responseJSON = JSON.parse(resp.data);
					if(typeof(responseJSON) !== 'undefined' && 
					   typeof(responseJSON['tax']) !== 'undefined' && 
					   typeof(responseJSON.tax['amount_to_collect']) !== 'undefined'){
					   tax = responseJSON.tax['amount_to_collect'];
					}	
				}
				$("#payTax").text(tax);
				$('#payTotal').html((mhm.Payment.roundTo2(planValue + parseFloat(tax))).toFixed(2));
			});	
		}
	}, 
	validateAndApplyCoupon : function(callback){
		
		var transactionData = {
				coupon : $('#payCoupon').val(),
				plan : $('#payPlan').val()
		}
		
		var hasCoupon = transactionData.coupon !== '' && transactionData.plan !== '';

		if(($('#payCoupon').data('plan') === $('#payPlan').val()) && ($('#payCoupon').data('validated') === $('#payCoupon').val())){
			if(callback){
				callback();
			}
			return;
		}else{
			//reset validation.
			$('#payCoupon').data('discount', null);
			$('#payCoupon').data('plan', null);
			$('#payCoupon').data('validated', null);
		}

		$('.payErrCoupon').empty();
		$('#payCouponDescription').empty();
		
		if(hasCoupon){
			
			$.ajaxSetup({
				contentType: "application/x-www-form-urlencoded; charset=UTF-8"
			});
			$.post('/app/member/billing/coupon/validate', {data : JSON.stringify(transactionData)}).done(function(resp){
				if (!!resp.err) {
					//alert(resp.data);
				}else {
					var responseJSON = JSON.parse(resp.data);
					if(typeof(responseJSON) !== 'undefined' && 
						typeof(responseJSON['status']) !== 'undefined' && responseJSON['status'] === 'SUCCESS' && responseJSON['valid'] === true){
						$('#payCoupon').data('discount', parseFloat(responseJSON['discount_in_cents']));
						$('#payCoupon').data('plan', transactionData.plan);
						$('#payCoupon').data('validated', transactionData.coupon);
						$('#payCouponDescription').html('<h5>' + responseJSON['description'] + '</h5>');			
						//calculate total applying the validated coupon.
						//make changes for the case where the plan changes in order to apply the validated coupon
						//make chnages for when the zip code get't a tax in order to conside the validated coupon ... actually tax should be calculated with the applied coupon
					}else{
						if(typeof(responseJSON['status']) !== 'undefined' && responseJSON['status'] === 'ERROR'){
							var messages = mhm.Payment.validationErrorMessages;
							var message = 'coupon.' + responseJSON['message_code'];
							if(typeof(messages[message]) !== 'undefined'){
								message = messages[message];
								$('.payErrCoupon').empty();
								$('#payCouponDescription').empty();
								$('.payErrCoupon').append($('<span class="pay-error-line">' + message + '</span>'));
								$('.payErrCoupon').parent().addClass('pay-error-ct');
							}
						}
					}	
				}
				if(callback){
					callback();
				}
			});	
		}else{
			if(callback){
				callback();
			}
		}
	},

	roundTo2 : function(number){
		return Math.round(number * 100) / 100;
	},
	validationErrorMessages : {
		'ccNumber.EMPTY_FIELD' : 'Credit card number',
		'zip.EMPTY_FIELD' : 'Enter a US zip code',
		'country.EMPTY_FIELD' : 'Country missing',
		'ccCvv.EMPTY_FIELD' : 'CVV missing',
		'ccDate.EMPTY_FIELD' : 'Expiration date',
		'ccDate.INVALID_FORMAT' : 'Expiration date format is incorect (mm/yy)',
		'ccFirstName.EMPTY_FIELD' : 'Please type in your first name',
		'ccLastName.EMPTY_FIELD' : 'Please type in your last name',
		'coupon.COUPON_REDEMPT_ERROR' : 'This coupon has been previously used with your account.',
		'coupon.COUPON_NOT_APPLICABLE_FOR_THE_SELECTED_PLAN_ERROR' : 'This coupon code is not applicable for the selected plan.',
		'coupon.COUPON_INVALID_ERROR' : 'This coupon code is either not valid or has expired.',
		'email.EMPTY_FIELD' : 'Email address is required.',
		'email.INVALID_EMAIL_ERROR' : 'Valid email address is required.',
		'email.EMAIL_ALREADY_IN_USE_ERROR' : 'Email address is already in use.',
		'emailConfirm.EMPTY_FIELD' : 'Please retype your email.',
		'emailConfirm.EMAIL_CONFIRM_MISSMATCH_ERROR' : 'Email addresses must match.',
		'organization.EMPTY_FIELD' : 'Please fill in the establishment name.',
		'password.EMPTY_FIELD' : 'Password is required.',
		'password.LENGTH_ERROR' : 'Password must be between 6 and 16 alphanumeric characters with no spaces or punctuation.',
		'password.ALPHANUMERIC_ERROR' : 'Password can\'t contain spaces or punctuation.',
		'login.EMAIL_OR_PASSWORD_INVALID_ERROR' : 'We couldn\'t find that login/password combination.',
		'businessType.EMPTY_FIELD' : 'Business type is required.',
		'restaurantType.EMPTY_FIELD' : 'Restaurant type is required.',
	},
	ui : {
		start : function(success, close, showClass, optionalConfiguration){
			
			var hasContent = mhm.Payment.hasContent;
			var configuration = mhm.Payment.configuration;
			if(typeof(showClass) !== 'undefined'){
				$('.pay-variant').hide();
				$('.' + showClass).show();
			}
			
			$('.box-left.bg').css("background-image", "url(/imageservice/images/img/13/pay-modal/" + showClass + ".png)"); /* setting the background for each type */
			$('#billing-modal-overlay').removeClass('pay-hidden');
			
			var startSlide = '.pay-introduction';
			
			
			/* 
			 * START Apply overrides  
			 * use the override in case a coupon must be explicitly enabled and certains election must take precedence 
			 */
			if(!hasContent(optionalConfiguration)){
				optionalConfiguration = {};
			}
			
			//default plan is used in conjunction with the set coupon. If the default plan is not visible then the coupon will be ignored too
			if(hasContent(mhm.Payment.constants.overwrites.defaultPlan)){
				var apply = true;
				if(hasContent(optionalConfiguration)){
					if(hasContent(optionalConfiguration.visiblePlans)){
						if(optionalConfiguration.visiblePlans.indexOf(mhm.Payment.constants.overwrites.defaultPlan) === -1){
							apply = false;
						}
					}
				}
				if(apply){
					optionalConfiguration.selectedPlan = mhm.Payment.constants.overwrites.defaultPlan;
					if(hasContent(mhm.Payment.constants.overwrites.coupon)){
						optionalConfiguration.coupon = mhm.Payment.constants.overwrites.coupon;
					}
				}else{
					//This is working right now only for the case when the user is a monthly and needs to upgrade to annual. 
					//For more flexibility we'll probbaly have to define better rulles depending on the scenarios we'll need to acomodate.
					if(hasContent(mhm.Payment.constants.overwrites.alternate.defaultPlan)){
						optionalConfiguration.selectedPlan = mhm.Payment.constants.overwrites.alternate.defaultPlan;
						if(hasContent(mhm.Payment.constants.overwrites.alternate.coupon)){
							optionalConfiguration.coupon = mhm.Payment.constants.overwrites.alternate.coupon;
							$('.' + mhm.Payment.constants.overwrites.alternate.defaultPlan + '-coupon').show();
						}
					}
				}
			}
			/* END Apply overrides */
			
			if(hasContent(optionalConfiguration)){
				if(hasContent(optionalConfiguration.overlayZIndex) && optionalConfiguration.overlayZIndex > 0){
					$('#billing-modal-overlay').css({'z-index' : optionalConfiguration.overlayZIndex});
				}
				if(hasContent(optionalConfiguration.executeInline)){
					mhm.Payment.flow.executeInline = optionalConfiguration.executeInline;
				}
				
				if(hasContent(optionalConfiguration.startSlide)){
					startSlide = optionalConfiguration.startSlide;
				}
				if(hasContent(optionalConfiguration.selectedPlan)){
					$('.plan-row').each(function(){
						if($(this).data('plan') === optionalConfiguration.selectedPlan){
							mhm.Payment.selectPlan($(this));
						}
					})
				}
				if(hasContent(optionalConfiguration.visiblePlans)){
					$('.plan-row').each(function(){
						if(optionalConfiguration.visiblePlans.indexOf($(this).data('plan')) === -1){
							$(this).hide();
						}
					})
				}
				//pay-cc-data-button, pay-cc-data-title
				if(hasContent(optionalConfiguration.messages)){
					if(hasContent(optionalConfiguration.messages.button)){
						$('#pay-cc-data-button').text(optionalConfiguration.messages.button)
					}
					if(hasContent(optionalConfiguration.messages.title)){
						$('#pay-cc-data-title').text(optionalConfiguration.messages.title)
					}
				}
				if(hasContent(optionalConfiguration.action)){
					configuration.action = optionalConfiguration.action;
				}
				if(hasContent(optionalConfiguration.onReceiptClose)){
					configuration.onReceiptClose = optionalConfiguration.onReceiptClose;
				}
				if(hasContent(optionalConfiguration.coupon)){
					$('#payCoupon').val(optionalConfiguration.coupon);
					mhm.Payment.validateAndApplyCoupon(mhm.Payment.calculateTax);
				}
				if(hasContent(optionalConfiguration.autofill)){
					if(hasContent(optionalConfiguration.autofill.firstName) && optionalConfiguration.autofill.firstName != null){
						$('#payCcFirstName').val(optionalConfiguration.autofill.firstName);
					}
					if(hasContent(optionalConfiguration.autofill.lastName) && optionalConfiguration.autofill.lastName != null){
						$('#payCcLastName').val(optionalConfiguration.autofill.lastName);
					}
					if(hasContent(optionalConfiguration.autofill.country) && optionalConfiguration.autofill.country != null){
						$('#payCountry').val(optionalConfiguration.autofill.country);
					}
					if(hasContent(optionalConfiguration.autofill.zip) && optionalConfiguration.autofill.zip != null){
						$('#payZip').val(optionalConfiguration.autofill.zip);
					}
				}
			}
			mhm.Payment.ui.showSlide(startSlide);
			mhm.Payment.flow.success = success;
			mhm.Payment.flow.close = close;
		},
		close : function(){
			var configuration = mhm.Payment.configuration;
			
			//if this flag is set, then create a free account for the customer and redirect the user to my-menu / templates.
			if(configuration.account.createFreeAccountOnClose){
				
				mhm.Payment.handlers.createFreemiumAccount(function(){
					$('#billing-modal-overlay').addClass('pay-hidden');
					if(typeof(mhm.Payment.flow.close) !== 'undefined'){
						mhm.Payment.flow.close();
					}
				});
				
			}else{
				
				if(configuration.redirectOnClose !== null){
					window.location = configuration.redirectOnClose;
				}else{
					//if the current slide is the receipt slide try to execute the receipt close action
					if(configuration.onReceiptClose && mhm.Payment.ui.isReceiptSlideActive()){
						configuration.onReceiptClose();
					}
					//this just closes the modal and executes the callback function received in the initialization step.
					$('#billing-modal-overlay').addClass('pay-hidden');
					if(typeof(mhm.Payment.flow.close) !== 'undefined'){
						mhm.Payment.flow.close();
					}	
				}
					
			}
		}, 
		showSlide : function(slide){
			$('.pay-slide').each(function(){
				if(!$(this).hasClass('pay-slide-hidden')){
					$(this).addClass('pay-slide-hidden')
				}
			})
			$(slide).removeClass('pay-slide-hidden');
		}, 
		isReceiptSlideActive : function(){
			if($('.pay-complete')){
				return !$('.pay-complete').hasClass('pay-slide-hidden');
			}
			return false;
		}
	},
	flow : {
		success : null,
		close : null,
		executeInline : false
	},
	tracking : {
		regSuccess : function(tracking_price, member_id){
			window.dataLayer = window.dataLayer || []
			dataLayer.push({
				'event': 'regSuccess',
				'transactionId': '' + member_id,
				'transactionTotal': '' + tracking_price,
				'printVal': '',
				'printOrderId': ''
			});
		}
	}
};

mhm.Payment.handlers = {
	validateAccountRegistrationData : function(onSuccess){
		var model = mhm.Payment.model;
		var configuration = mhm.Payment.configuration;
		
		model.email = $('#regEmail').val();
		model.emailConfirm = $('#regEmailConfirm').val();
		model.password = $('#regPassword').val();
		model.organization = $('#regOrganization').val();
		model.businessType = $('#regBusinessType').val();
		model.restaurantType = $('#regRestaurantType').val();

		//irelevant for the registration and login mode.
		configuration.account.createFreeAccountOnClose = false;
		
		$.ajaxSetup({
			contentType: "application/x-www-form-urlencoded; charset=UTF-8"
		});
		$.post('/app/member/account/data/validate', {data : JSON.stringify(model)}).done(function(resp){
			
			$('#btnPaySubscribe').removeClass('disabled');
			if (!!resp.err) {
				//alert(resp.data);
			}else {
				var responseJSON = JSON.parse(resp.data);
				if(responseJSON.status && responseJSON.status === 'SUCCESS'){
					
					if(typeof(onSuccess) !== 'undefined'){
						onSuccess();
					}
				
				}else{
					$('#loginSpinnerContainer').hide();
					if(responseJSON.status && responseJSON.status === 'VALIDATION_ERRORS'){
						mhm.Payment.showRegistrationValidationErrors(responseJSON.errors);
					}	
				}
			}
		});
	},
	createFreemiumAccount : function(onFail){
		var model = mhm.Payment.model;
		
		model.email = $('#regEmail').val();
		model.emailConfirm = $('#regEmailConfirm').val();
		model.password = $('#regPassword').val();
		model.organization = $('#regOrganization').val();
		model.businessType = $('#regBusinessType').val();
		model.restaurantType = $('#regRestaurantType').val();
		
		$.ajaxSetup({
			contentType: "application/x-www-form-urlencoded; charset=UTF-8"
		});
		$.post('/app/member/account/freemium/save', {data : JSON.stringify(model)}).done(function(resp){
			if (!!resp.err) {
				//alert(resp.data);
			}else {
				var responseJSON = JSON.parse(resp.data);
				if(responseJSON.status && responseJSON.status === 'SUCCESS'){
					
					$.post('/app/member/account/authenticate/sso/auth/i', {data : JSON.stringify(responseJSON.auth)}).done(function(rsp){
						if (!!rsp.err) {
							//alert(resp.data);
						}else { 
							var responseJSON = rsp; //[KEY_REVERT_AUTH] //JSON.parse(resp.data);
							if(typeof(rsp.data) !== 'undefined'){
								responseJSON = JSON.parse(rsp.data);
							}
							if(responseJSON.status && responseJSON.status === 'SUCCESS'){
								
								try{
									mhm.Payment.tracking.regSuccess(0, responseJSON.member.id);
								}catch(err){
									console.log(err);
								}
								
								//when PDF upload occurs, the flow must remain in place in order to complete the PDF upload. Redirect will be performed afterwards.
								if(mhm.Payment.flow.executeInline && typeof(mhm.Payment.flow.success) !== 'undefined'){
									mhm.Payment.flow.success(responseJSON);
									$('#billing-modal-overlay').addClass('pay-hidden');
								}else{
									//**** start - redirect to my menus
									window.location = '/menu/browse.do';
									//**** start - redirect to my menus
								}
							}
						}
					})
					
				}else{
					if(typeof(onFail) === 'undefined'){
						onFail();
					}
				}
			}
		});
	},

	login: function(){
		var model = {
			'email' : $('#loginEmail').val(),
			'password' : $('#loginPassword').val()
		};

		$.ajaxSetup({ contentType: "application/x-www-form-urlencoded; charset=UTF-8" });

		$.post('/app/member/account/authenticate/sso/auth', {
			data : JSON.stringify(model)
		}).done(function(resp) {
			if (!resp.err) {
				var responseJSON = resp;
				if (typeof(resp.data) !== 'undefined') {
					responseJSON = JSON.parse(resp.data);
				}
				if (responseJSON.status && responseJSON.status === 'SUCCESS') {
					if (typeof(responseJSON['next']) !== 'undefined') {
						window.location = '/menu/' + responseJSON['next'];
					} else {
						if (mhm.Payment.flow.executeInline && typeof(mhm.Payment.flow.success) !== 'undefined') {
							mhm.Payment.flow.success(responseJSON);
							$('#billing-modal-overlay').addClass('pay-hidden'); 
						} else {
							$.get('/app/member/account/check/status').done(function(resp){
								if (typeof(resp.data) !== 'undefined') {
									responseJSON = JSON.parse(resp.data);
								}
								if (typeof(responseJSON['next']) !== 'undefined') {
									window.location = '/menu/' + responseJSON['next'];
								} else {
									window.location = '/menu/member.do';
								}
							})
						}
					}
				} else {
					if (responseJSON.status && responseJSON.status === 'VALIDATION_ERRORS') {
						$('#loginSpinnerContainer').hide();
						mhm.Payment.showLoginValidationErrors(responseJSON.errors);
					} else {
						console.log('There was an error preventing the login to complete! Last response received : ' + JSON.stringify(responseJSON));
						setTimeout(function(){
							window.location = '/menu/member.do';
						}, 500)
					
					}	
				}
			}
		});
	},
	
	applyCCData : function(){
		var model = mhm.Payment.model;
		model.ccNumber = $('#payCcNumber').val();
		model.zip = $('#payZip').val();
		model.ccDate = $('#payCcMonth').find(":selected").val() + "/" + $('#payCcYear').find(":selected").val(); //$('#payCcDate').val();
		model.ccCvv = $('#payCcCvv').val();
		model.ccFirstName = $('#payCcFirstName').val();
		model.ccLastName = $('#payCcLastName').val();
		model.plan = $('#payPlan').val();
		model.country = $('#payCountry').find(":selected").val();
		model.coupon = $('#payCoupon').data('validated');
		if($('#payMemberId') && $('#payMemberId').val()){
			model.memberId = $('#payMemberId').val();
		}
	},
	applyUserData : function(){
		var model = mhm.Payment.model;
		model.email = $('#regEmail').val();
		model.emailConfirm = $('#regEmailConfirm').val();
		model.password = $('#regPassword').val();
		model.organization = $('#regOrganization').val();
	},
	createPaidAccount : function(){
		
		var model = mhm.Payment.model;
		var configuration = mhm.Payment.configuration;
		
		mhm.Payment.handlers.applyCCData();
		mhm.Payment.handlers.applyUserData();
		
		$.ajaxSetup({
			contentType: "application/x-www-form-urlencoded; charset=UTF-8"
		});
		$.post('/app/member/account/paid/save', {data : JSON.stringify(model)}).done(function(resp){

			$('#btnPaySubscribe').removeClass('disabled');
			if (!!resp.err) {
				//alert(resp.data);
			}else {
				var responseJSON = JSON.parse(resp.data);
				if(responseJSON.status && responseJSON.status === 'SUCCESS'){
					
					var registrationCallback = function(response){
						
						if (!!response.err) {
							//alert(resp.data);
						}else { 
							var rspJSON = response; //[KEY_REVERT_AUTH] //JSON.parse(resp.data);
							if(typeof(response.data) !== 'undefined'){
								rspJSON = JSON.parse(response.data);
							}
							if(rspJSON.status && rspJSON.status === 'SUCCESS'){

								//**** start - show the confirmation screen
								var transaction = responseJSON.transaction;
								var member = responseJSON.member;

								var discount = 0.0;
								try{
									discount = $('#payCoupon').data('discount') / 100;
								}catch(err){
									console.log(err.stack);
								}

								$('#paySalesTax').text("$" + transaction.salesTax.toFixed(2));
								var total = mhm.Payment.roundTo2(parseFloat(transaction.planPrice / 100) - discount + transaction.salesTax).toFixed(2);
								$('#paySubTotal').text("$" + total);
								$('#payRenewalDate').text(transaction.renewalDate);
								$('#payPlanName').text(transaction.planName);

								try{
									mhm.Payment.tracking.regSuccess(total, transaction.memberId);
								}catch(err){
									console.log(err);
								}
								
								if(typeof(mhm.Payment.flow.success) !== 'undefined'){
									mhm.Payment.flow.success(rspJSON);
								}
								
								mhm.Payment.ui.showSlide('.pay-complete');

								/* do some default after success handling for new paid accounts */
								var configuration = mhm.Payment.configuration;
								//reset this flag after the account was created.
								if(configuration.account.createFreeAccountOnClose){
									configuration.account.createFreeAccountOnClose = false;
								}
								//set a redirect to browse.do in case of new accounts.
								configuration.redirectOnClose = "/menu/browse.do";
								//**** end - show the confirmation screen

							}else{
								console.log('authentication failure : ' + responseJSON);
							}
						}
					}

					$.post('/app/member/account/authenticate/sso/auth/i', {data : JSON.stringify(responseJSON.auth)}).done(registrationCallback);

				}else{
					if(responseJSON.status && responseJSON.status === 'VALIDATION_ERRORS'){
						mhm.Payment.showValidationErrors(responseJSON.errors);
					}else{
						if(responseJSON.status && responseJSON.status === 'RECURLY_ERRORS'){
							mhm.Payment.showRecurlyErrors(responseJSON.errors);
						}	
					}	
				}
			}
		});
	},
	upgradeToPaidPlan : function(){
		
		var model = mhm.Payment.model;
		var configuration = mhm.Payment.configuration;
		
		mhm.Payment.handlers.applyCCData();
		
		$.ajaxSetup({
			contentType: "application/x-www-form-urlencoded; charset=UTF-8"
		});
		
		
		var processUpgradeResponse = function(responseJSON){
			if(responseJSON.status && responseJSON.status === 'SUCCESS'){

				transaction = responseJSON.transaction;

				var discount = 0.0;
				try{
					discount = $('#payCoupon').data('discount') / 100;
				}catch(err){
					console.log(err.stack);
				}

				$('#paySalesTax').text("$" + transaction.salesTax.toFixed(2));
				var total = mhm.Payment.roundTo2(parseFloat(transaction.planPrice / 100) - discount + transaction.salesTax).toFixed(2);
				$('#paySubTotal').text("$" + total);
				$('#payRenewalDate').text(transaction.renewalDate);
				$('#payPlanName').text(transaction.planName);

				try{
					mhm.Payment.tracking.regSuccess(total, transaction.memberId);
				}catch(err){
					console.log(err);
				}

				if(typeof(mhm.Payment.flow.success) !== 'undefined'){
					mhm.Payment.flow.success(responseJSON);
				}

				mhm.Payment.ui.showSlide('.pay-complete');

			}else{
				if(responseJSON.status && responseJSON.status === 'VALIDATION_ERRORS'){
					mhm.Payment.showValidationErrors(responseJSON.errors);
				}else{
					if(responseJSON.status && responseJSON.status === 'RECURLY_ERRORS'){
						mhm.Payment.showRecurlyErrors(responseJSON.errors);
					}	
				}	
			}
		}
		
		var upgradeUserPlan = function(){
			$.post('/app/member/plan/upgrade', {data : JSON.stringify(model)}).done(function(resp){

				$('#btnPaySubscribe').removeClass('disabled');
				if (!!resp.err) {
					//alert(resp.data);
				}else {
					var rspJSON = JSON.parse(resp.data);
					processUpgradeResponse(rspJSON);
				}
			});
		}
		
		if(typeof(data) !== 'undefined' && typeof(data.design) !== 'undefined'){
			$.post('/app/member/plan/upgrade', {data : JSON.stringify(model)}).done(function(resp){

				$('#btnPaySubscribe').removeClass('disabled');
				if (!!resp.err) {
					//alert(resp.data);
				}else {
					var rspJSON = JSON.parse(resp.data);
					if(rspJSON.status && rspJSON.status === 'ERROR' && rspJSON.message && rspJSON.message.indexOf('no member logged') > -1){
						var location = (window.location + "");
    					var appName = 'x';
    					if(location.indexOf('timber-test') > -1){
    						appName = 'timber-test';
    					}else{
    						if(location.indexOf('xstage') > -1){
	    						appName = 'xstage';
	    					}	
    					}
    					$.get('/' + appName + '/account/login/main/sso?server=' + window.location.hostname).done(function(response){
    						if (!!response.err) {
    			    		
    						}else{
    							var responseJSON = JSON.parse(response.data);
    			    			if(responseJSON.status === "SUCCESS"){
    			    				upgradeUserPlan();
    			    			}
    			    		}				
    					})
	    			}else{
						processUpgradeResponse(rspJSON);
					}
				}
			});
		}else{
			upgradeUserPlan();
		}
		
	},
	extendPaidPlan : function(){
		
		var model = mhm.Payment.model;
		var configuration = mhm.Payment.configuration;
		
		mhm.Payment.handlers.applyCCData();
		
		$.ajaxSetup({
			contentType: "application/x-www-form-urlencoded; charset=UTF-8"
		});
		$.post('/app/member/account/paid/extend', {data : JSON.stringify(model)}).done(function(resp){
			
			$('#btnPaySubscribe').removeClass('disabled');
			if (!!resp.err) {
				//alert(resp.data);
			}else {
				var responseJSON = JSON.parse(resp.data);
				if(responseJSON.status && responseJSON.status === 'SUCCESS'){
				
					transaction = responseJSON.transaction;
	
					var discount = 0.0;
					try{
						discount = $('#payCoupon').data('discount') / 100;
					}catch(err){
						console.log(err.stack);
					}
					
					$('#paySalesTax').text("$" + transaction.salesTax.toFixed(2));
					var total = mhm.Payment.roundTo2(parseFloat(transaction.planPrice / 100) - discount + transaction.salesTax).toFixed(2);
					$('#paySubTotal').text("$" + total);
					$('#payRenewalDate').text(transaction.renewalDate);
					$('#payPlanName').text(transaction.planName);
					
					if(typeof(mhm.Payment.flow.success) !== 'undefined'){
						mhm.Payment.flow.success();
					}
				
					mhm.Payment.ui.showSlide('.pay-complete');
					
				}else{
					if(responseJSON.status && responseJSON.status === 'VALIDATION_ERRORS'){
						mhm.Payment.showValidationErrors(responseJSON.errors);
					}else{
						if(responseJSON.status && responseJSON.status === 'RECURLY_ERRORS'){
							mhm.Payment.showRecurlyErrors(responseJSON.errors);
						}	
					}	
				}
			}
		});
	}
}

$('#payCcNumber').on('keyup', function() {
  var ccnum = $(this).val().split(" ").join(""); 
  if (ccnum.length > 0) {
    ccnum = ccnum.match(new RegExp('.{1,4}', 'g')).join(" ");
  }
  $(this).val(ccnum);
});

$('#loginPassword').keypress(function (e) {
 var key = e.which;
 if(key == 13)  // the enter key code
  {
    $('#btnLoginAndGoToPayment').click();
    return false;  
  }
});

$('#regPassword').keypress(function (e) {
 var key = e.which;
 if(key == 13)  // the enter key code
  {
    $('#btnCreateFreemiumAccount').click();
    return false;  
  }
});

$('#regBusinessType').on('change', function() {
  var businessType = $(this).val(); 
  if (businessType != '' && businessType != '4') {
    $('#regRestaurantType').removeClass('hidden');
  }else{
	  $('#regRestaurantType').addClass('hidden');
  }
});

$("#terms").on('change', function() {
  if(this.checked) {
    $('#btnPaySubscribe').removeClass("inactive");
  } else {
    $('#btnPaySubscribe').addClass("inactive");
  }
});

$(document).ready(function(){
	mhm.Payment.init();
})

/* toggle coupon */
$(document).ready(function(){
	$('#show-coupon').click(function(){
	  $('.coupon-show').slideToggle();
	  $('.icon-angle-down').toggleClass('coupon-open');
	}); 
	$("#show-annual").click(function(){
	  $(".plan-section").slideToggle();
	}); 
	 
});
