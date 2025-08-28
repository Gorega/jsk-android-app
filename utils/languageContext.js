import { createContext, useContext, useState, useEffect } from 'react';
import { ActivityIndicator, I18nManager, Alert } from "react-native";
import { getToken, saveToken } from './secureStore';

// Import DevSettings for development environment restarts
import { DevSettings } from 'react-native';

// Import RN module conditionally
let RNRestart;
try {
  // This will only work in production when the module is available
  RNRestart = require('react-native-restart').default;
} catch (error) {
  // Module not available, will use fallback
  RNRestart = null;
}

// IMPORTANT: This is the centralized RTL configuration
// It runs at module initialization time to ensure RTL is set before any UI renders
(async () => {
  try {
    const savedLanguage = await getToken('language') || 'ar';
    const shouldBeRTL = savedLanguage === 'ar' || savedLanguage === 'he';
    
    // This is critical for first app load in production
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  } catch (error) {
    console.error("Failed to set initial RTL:", error);
    // If we can't determine the language, default to system settings
  }
})();

const LanguageContext = createContext();

export const translations = {
  en: {
    // Driver and delivery company onboarding
    onboarding: {
      assignOrdersTitle: "Assign Orders",
      assignOrdersMessage: "Use this option to scan order QR codes and assign them to your route. This helps you organize deliveries efficiently and track packages throughout the delivery process.",
      routesTitle: "Manage Routes",
      createOrdersTitle: "Create Orders",
      createOrdersMessage: "Create new orders quickly and efficiently.",
      routesMessage: "Create and manage delivery routes to optimize your deliveries. Plan your journey, track progress as you complete orders, and navigate efficiently between delivery locations.",
      
      // Orders onboarding tutorial
      orders: {
        welcome: {
          title: "Welcome to Orders!",
          description: "Let's explore how to manage your orders efficiently."
        },
        expand: {
          title: "Expand & Collapse",
          description: "Tap the arrow button to expand or collapse an order to see more or less details."
        },
        track: {
          title: "Track Orders",
          description: "Tap on any order to see its detailed tracking information and history."
        },
        status: {
          title: "Change Status",
          description: "Long press on an order or tap the status badge to update the order status."
        },
        edit: {
          title: "Edit Orders",
          description: "Long press on an order to access edit options for order details."
        },
        phone: {
          title: "Edit Phone",
          description: "Long press on an order to access the option to edit receiver phone numbers."
        },
        complaint: {
          title: "Open Complaints",
          description: "Long press on an order and select 'Open Case' to report issues with your order."
        },
        tapToExpand: "Tap to expand"
      }
    },
    
    // Add driver statistics translations
    driverStats: {
      title: "Driver Statistics",
      count: "Count",
      deliveryFee: "Delivery Fee",
      codValue: "COD Value",
      ordersChart: "Orders Distribution",
      dateRange: "Date Range",
      selectPeriod: "Select Period",
      periods: {
        day: "Day",
        week: "Week",
        month: "Month",
        half_year: "6 Months",
        year: "Year"
      },
      statuses: {
        delivered: "Delivered",
        returned: "Returned",
        on_the_way: "On The Way",
        total: "Total"
      }
    },
    
    // Create order onboarding
    createOnboarding: {
      welcome: {
        title: "Welcome to Order Creation!",
        message: "Let's walk through the process of creating a new order. Swipe left to continue or use the navigation buttons."
      },
      orderTypes: {
        title: "Order Types",
        message: "Choose the type of order you need:\n\n• Delivery: Send packages to customers\n• Receive: Get items from suppliers\n• Delivery/Receive: Exchange items\n• Payment: Financial transactions only"
      },
      reference: {
        title: "Reference Number",
        message: "Add a unique reference ID to easily track this order in your system. You can scan a barcode or enter it manually."
      },
      client: {
        title: "Client Information",
        message: "Enter the receiver's contact details including name, phone numbers, city, and address. You can search for existing clients or add new ones."
      },
      cost: {
        title: "Cost Details",
        message: "Set payment method (cash, check, or both), COD amount, and delivery fees. You can add multiple currencies if needed. Toggle \"Deduct from balance\" for business accounts."
      },
      netValue: {
        title: "Net Value Calculation",
        message: "The system automatically calculates the net value based on COD amounts and delivery fees. Different currencies are shown separately."
      },
      details: {
        title: "Package Details",
        message: "Describe what's being shipped, quantity, weight, and package type. For receive orders, specify what items you expect to receive."
      },
      notes: {
        title: "Additional Notes",
        message: "Add any special instructions or information that may help with delivery or handling of this order."
      },
      ready: {
        title: "Ready to Go!",
        message: "You're all set! Click the submit button when you've filled in all the required information to create your order."
      },
      back: "Back",
      next: "Next",
      skip: "Skip Tutorial",
      finish: "Get Started"
    },
    
    
    // (auth)
    auth:{
      login:"Login",
      dontHaveAccount:"Don't Have Account?",
      register: "Register",
      username: "Username",
      mobileNumber: "Mobile Number",
      email: "Email",
      password: "Password",
      city:"City",
      area:"Area",
      address:"Address",
      comercialName:"Comercial Name",
      registerSuccess:"You have created your account successfully, please login now",
      registrationFailed:"Faild",
      loginFailed:"Login Failed",
      phonePlaceholder:"Enter your phone number",
      passwordPlaceholder:"Enter your password",
      biometricLoginFailed:"Biometric Login Failed",
      noPreviousLogin:"Please login with your credentials first to enable biometric login",
      biometricPrompt:"Login with biometrics",
      cancel:"Cancel",
      biometricFailed:"Authentication failed",
      credentialsNotFound:"Saved credentials not found",
      phoneRequired:"Phone number is required",
      passwordRequired:"Password is required",
      welcome:"Welcome Back",
      signMessage:"Sign in to your account",
      loginWithBiometric:"login With Biometric",
      or:"Or",
      forgotPassword:"Forget Password",
      register:"Register",
      usernamePlaceholder:"Enter your full name",
      emailPlaceholder:"Enter your email (optional)",
      phonePlaceholder:"Enter your phone number",
      passwordPlaceholder:"Create a password",
      confirmPasswordPlaceholder:"Confirm your password",
      comercialNamePlaceholder:"Enter your business name",
      businessActivity:"Business Activity",
      businessActivityPlaceholder:"What do you sell/provide? (optional)",
      cityPlaceHolder:"Select your city",
      addressPlaceholder:"Enter your address",
      areaPlaceholder:"Enter your area",
      secondPhone:"Second Phone",
      secondPhonePlaceholder:"Enter alternate phone (optional)",
      website:"Website",
      websitePlaceholder:"Enter your website URL (optional)",
      tiktok:"Tiktok",
      facebook:"Facebook",
      instagram:"Instagram",
      tiktokPlaceholder:"Enter your TikTok handle (optional)",
      facebookPlaceholder:"Enter your Facebook page (optional)",
      instagramPlaceholder:"Enter your Instagram handle (optional)",
      personalInfo:"Personal Information",
      businessDetails:"Business Details",
      socialMedia:"Social Media",
      nameRequired:"Name is required",
      passwordValidation:"Password must be at least 6 characters",
      passwordConfirmation:"Please confirm your password",
      passwordMismatch:"Passwords do not match",
      businessNameRequired:"Business name is required",
      cityRequired:"City is required",
      noFields:"No fields available for this step",
      successRegiser:"Registration Successful",
      back:"Back",
      next:"Next",
      createAccount:"Create Account",
      step:"Step",
      of:"of",
      role:{
        title:"Role",
        business:"Business",
        driver:"Driver"
      }
    },

    errors:{
      error:"Error",
      success:"Success",
      failedToParse:"Failed to parse server response. Please try again.",
      requestTimedOut:"The request timed out. Please check your connection and try again.",
      requestAborted:"The request was aborted. Please try again.",
      unexpectedError:"An unexpected error occurred. Please try again.",
      pleaseSelectStatus:"Please select a status",
      pleaseSelectReason:"Please select a reason",
      pleaseSelectBranch:"Please select a branch",
      noItemsScanned:"No items scanned"
    },

      "check": {
        "receiver": {
          "title": "Check Receiver",
          "desc": "Enter phone number to check if receiver exists",
          "placeholder": "Enter phone number",
          "results": "Receiver Results",
          "noResults": "No receiver found with this phone number",
          "totalOrders": "Total Orders",
          "returnedOrders": "Returned",
          "comment": "Comment"
        }
      },

    driverNotification:{
      title:"Notify Drivers",
      cancel:"Cancel",
      send:"Send",
      sendNotification:"Send Notification",
      sending:"Sending...",
      sent:"Sent",
      error:"Error",
      selectDrivers:"Select Drivers",
      selectDriversMessage:"Please select at least one driver to notify.",
      notificationSent:"Notification sent successfully",
      success:"Success",
      errorMessage:"Failed to send notification"
    },
    
    common:{
      createNew:"Create New",
      delete:"Delete",
      cancel:"Cancel",
      confirm:"Confirm",
      save:"Save",
      close:"Close",
      edit:"Edit",
      view:"View",
      success:"Success",
      error:"Error",
      loadingOrders:"Loading available orders...",
      retry:"Retry",
      loading:"Loading...",
      loadingMore:"Loading more orders...",
      pending:"Pending",
      gotIt:"Got it!",
      skip:"Skip",
      next:"Next",
      refresh:"Refresh",
      finish:"Finish",
      someUpdatesFailed:"Some updates failed",
      updateError:"Update error",
    },

    balance:{
      balanceHistory:"Balance History",
      paymentType:"Payment",
      transaction:"Transaction",
      adjustment:"Adjustment",
      balanceAfter:"Balance",
      currentBalance:"Current Balance",
      noTransactions:"No Transactions Found",
      loading:"Loading"
    },

    // (tabs)
    tabs:{
      index:{
        title:"Dashboard",
        summaryTitle:"Orders Summary",
        statusTitle:"Status Overview",
        boxes:{
          todayOrders:"Today Orders",
          moneyInBranches:"Money in Branches",
          readyMoney:"Ready Money to Receive",
          readyOrders:"Returned/exchanged packages ready for collection",
          moneyInBranch:"Money in Branch",
          moneyWithDrivers:"Money With Drivers",
          moneyWithDriver:"Money With Driver",
          inWaiting:"In Waiting",
          inBranch:"In Branch",
          onTheWay:"On the Way",
          delivered:"Delivered",
          returned:"Returned",
          returnedInBranch:"Returned In Branch",
          rescheduled:"Rescheduled",
          stuck:"Stuck",
          rejected:"Rejected",
          ofOrders:"of Orders",
          withDriver:"With Driver"
        },
        balanceTitle:"Your Balance",
        balance:{
          available:"Available",
        }
      },
      orders:{
        title:"Orders",
        emptyArray:"No Orders to show",
        filters:{
          // filterByGroup
          all:"All",
          todayOrders:"Today Orders",
          waiting:"Waiting",
          rejected:"Rejected",
          inBranch:"In Branch",
          inProgress:"In Progress",
          stuck:"Stuck",
          delayed:"Delayed",
          onTheWay:"On The Way",
          replacedDeliveredOrders:"Replaced",
          driverResponsibilityOrders:"Driver Responsibility Orders",
          rescheduled:"Rescheduled",
          returnBeforeDeliveredInitiated:"Return Before Delivered Initiated",
          returnAfterDeliveredInitiated:"Return After Delivered Initiated",
          returned:"Returned",
          returnedInBranch:"Returned In Branch",
          returnedOut:"Returned Out",
          businessReturnedDelivered:"Business Returned Delivered",
          delivered:"Delivered",
          moneyInBranch:"money In Branch",
          moneyOut:"money Out",
          businessPaid:"Business Paid",
          completed:"completed",
          received:"Received",
          "delivered/received":"Delivered / Received",
          dispatched_to_branch:"Dispatched to Branch",
          // searchByGroup
          orderId:"Order ID",
          referenceID:"Reference ID",
          sender:"Sender",
          receiverName:"Receiver Name",
          receiverPhone:"Receiver Phone",
          receiverCity:"Receiver City",
          receiverArea:"Receiver Area",
          receiverAddress:"Receiver Address",
          driverName:"Driver Name",
          // searchByDateGroup
          today:"Today",
          yesterday:"Yesterday",
          thisWeek:"This Week",
          thisMonth:"This Month",
          thisYear:"This Year",
          selectDate:"Select a Date",
        },
        track:{
          orderTracking:"Order Tracking",
          order:"Order",
          package:"Package",
          quantity:"Quantity",
          weight:"Weight",
          receivedItems:"Received Items",
          receivedQuantity:"Received Quantity",
          deliveryStatus:"Delivery Status",
          branch:"Branch",
          issue:"Have an issue, Apply a complaint",
          openCase:"Open a complaint",
          unknown:"Unknown",
          loading:"Loading...",
          errorTitle:"Oops!",
          orderNotFound:"Order not found or could not be loaded",
          goBack:"Go Back",
          tryAgain:"Try Again",
          receiverInfo:"Receiver Info",
          name:"Name",
          mobile:"mobile",
          secondMobile:"Second Mobile",
          location:"Location",
          address:"Address",
          senderInfo:"Sender Info",
          orderDetails:"Order Details",
          orderType:"Order Type",
          paymentType:"Payment Type",
          referenceId:"Reference ID",
          itemType:"Item Type",
          driver:"Driver",
          financialDetails:"Financial Details",
          codValue:"COD Value",
          deliveryFee:"Delivery Fee",
          netValue:"Net Value",
          checks:"Checks",
          checkNumber:"Check Number",
          checkValue:"Check Value",
          checkDate:"Check Date",
          notes:"Notes",
          packageDetails:"Package Details",
          package:"package",
          quantity:"Quantity",
          weight:"Weight",
          receivedItems:"Received Items",
          receivedQuantity:"Received Quantity",
          deliveryStatus:"Delivery Status",
          needHelp:"Need Help",
          openCase:"Open Case"
        },
        "order": {
          "states": {
            "on_the_way_back": "Returned to delivery process",
            "pickedUp": "Picked up",
            "deliveredToDestinationBranch": "Delivered to destination branch",
            "rejected": "Rejected",
            "cancelled": "Cancelled",
            "stuck": "Stuck",
            "rescheduled": "Rescheduled",
            "referenceIdUpdated": "Reference ID updated successfully",
            "referenceIdUpdateError": "Failed to update Reference ID",
            "return_before_delivered_initiated": "Return before delivery initiated",
            "return_after_delivered_initiated": "Return after delivery initiated",
            "return_after_delivered_fee_received": "Return after delivery and fee received",
            "delayed": "Delayed",
            "suspendReasons": {
              "closed": "Closed",
              "no_response": "No response",
              "cancelled_from_office": "Cancelled from office",
              "address_changed": "Address changed",
              "not_compatible": "Not compatible with specifications",
              "delivery_fee_issue": "Doesn't want to pay delivery fee",
              "duplicate_reschedule": "Duplicate reschedule request",
              "receive_issue": "Doesn't want to receive",
              "sender_cancelled": "Cancelled by sender",
              "reschedule_request": "Recipient requested delivery reschedule",
              "incorrect_number": "Incorrect number",
              "not_existing": "Recipient doesn't exist in country",
              "cod_issue": "Doesn't want to pay for shipment",
              "death_issue": "Recipient has death case",
              "not_exist_in_address": "Recipient doesn't exist at delivery address",
              "receiver_cancelled": "Cancelled by recipient",
              "receiver_no_response": "No response from recipient",
              "order_incomplete": "Shipment incomplete",
              "receive_request_issue": "Recipient didn't request shipment",
              "other": "Other reason"
            },
            "on_the_way": "On the way",
            "dispatched_to_branch": "Dispatched to branch",
            "delivered": "Delivered",
            "waiting": "Waiting",
            "inBranch": "In branch",
            "inProgress": "In progress",
            "delivered": "Delivered",
            "received": "Received",
            "delivered_received": "Delivered / Received"
          },
          "editPhone": "Edit",
          "receiverAddress": "Recipient address",
          "codValue": "COD value",
          "codUpdateReason": "Reason for changing COD value",
          "enterReason": "Enter reason for change",
          "codUpdateNote": "Note: Changing COD value requires sender approval",
          "loading": "Loading...",
          "codValue": "Shipment cost",
          "error": "Error",
          "errorFetchingOrder": "Error fetching order data",
          "ok": "OK",
          "phoneUpdateSuccess": "Phone numbers updated successfully",
          "receiverDetailsUpdateSuccess": "Recipient details updated successfully",
          "codUpdateRequestSuccess": "COD value change request sent successfully",
          "receiverPhones": "Recipient phones",
          "loading": "Loading...",
          "error": "Error",
          "errorFetchingOrder": "Error fetching order data",
          "ok": "OK",
          "missingStatus": "No status selected",
          "selectReason": "Select reason",
          "statusChangeSuccess": "Status updated successfully",
          "enterReferenceId":"Enter Reference ID",
            "referenceIdHelper":"You can type it or scan a QR/barcode",
            "referenceIdPlaceholder":"Type or scan reference ID",
            "scan":"Scan",
            "skip":"Skip",
            "save":"Save",
            "referenceIdRequired":"Reference ID is required",
          "statusChangeError": "Failed to update status",
          "selectBranch": "Select branch",
          "reason": "Reason",
          "branch": "Branch",
          "orderType": "Shipment type",
          "unknown": "Unknown",
          "userSenderBoxLabel": "Sender",
          "userClientBoxLabel": "Client",
          "userDriverBoxLabel": "Driver",
          "userBoxPhoneContactLabel": "Call",
          "userBoxMessageContactLabel": "Message",
          "contactPhone": "Phone",
          "contactWhatsapp": "WhatsApp",
          "edit": "Edit",
          "status":"Status",
          "changeStatus": "Change status",
          "confirmStatusChange":"Are you sure you want to change the status of this order?",
          "changeStatusAlert": "You're about to change shipment status to",
          "changeStatusAlertNote": "Write a note...",
          "changeStatusAlertConfirm": "Confirm",
          "changeStatusAlertCancel": "Cancel",
          "print": "Print",
          "location": "Location",
          "to_branch":"Sent to branch",
          "to_driver":"Sent to driver",
          "financialDetails": "Financial details",
          "codValue": "Shipment cost",
          "netValue": "Amount due to merchant",
          "deliveryFee": "Delivery fee",
          "checksAvailable": "Available checks",
          "note": "Note",
          "add_currency": "Add another currency",
          "success": "Success",
          "orderActions": "Order actions",
          "receivedItems": "Received items",
          "receivedQuantity": "Received quantity",
          "noteRequiredForOther": "Note required when selecting \"Other\" reason",
          "statusChangeOffline": "Status will update when online",
          "orderChecks": {
            "addCheck": "Add check",
            "title": "Order checks",
            "orderId": "Order number",
            "loading": "Loading...",
            "totalChecks": "Total checks",
            "totalValue": "Total value",
            "check": "Check",
            "value": "Value",
            "checkNumberPlaceholder": "Enter check number",
            "number": "Number",
            "currency": "Currency",
            "date": "Date",
            "noChecks": "No checks",
            "noChecksMessage": "No checks associated with this order.",
            "backToOrder": "Back",
            "checkDetails": "Check details",
          }
        },
        "validation": {
          "required": "This field is required"
        },
        "save": "Save changes",
        "cancel": "Cancel",
        "error": "Error",
        "success": "Success",
        "errorMsg": "An error occurred",
        "errorValidationMsg": "Please correct the errors in the form",
        "resend":"Resend",
        // (create)
        create:{
          edit:"Edit Order",
          create:"Create Order",
          submit:"Submit",
          loading:"Loading...",
          success:"Success",
          insufficientBalance:"Insufficient Balance",
          insufficientBalanceMsg:"Insufficient Balance",
          successMsg:"Your order have been completed successfully",
          error:"Error",
          errorValidationMsg:"Please check the highlighted fields",
          errorMsg:"An unexpected error occurred, Please call the support agent to help",
          "save": "Save Changes",
          "cancel": "Cancel",
          "phoneUpdateSuccess": "Phone numbers updated successfully",
          sections:{
            referenceId:{
              title:"Reference ID (optional)",
              explain:"Enter your QR code if available"
            },
            sender:{
              title:"Sender",
              fields:{
                sender: "Sender",
                with_money_receive: "With Money Receive",
                my_balance_deduct: "Deduct from my balance",
                sender_deduct: "Deduct from sender balance",
                processing_return: "Processing Return",
                please_wait: "Please wait...",
                return_success: "Return Successful",
                balance_returned: "Balance has been returned successfully",
                return_error: "Return Error",
                return_failed: "Failed to return balance",
                deduction_error: "Deduction Error",
                deduction_failed: "Failed to process deduction",
                updating_deductions: "Updating Deductions",
                update_deduction_failed: "Failed to update deductions",
                deduction_success: "Deduction Successful",
                deduction_processed: "Deduction has been processed successfully",
                processing_deduction: "Processing Deduction",
                select_deduction_method: "Select Deduction Method",
                choose_deduction_method: "Choose how you want to deduct the balance",
                manual_deduction: "Manual Deduction",
                auto_deduction: "Auto Deduction",
                checking_balance: "Checking Balance",
                select_deduction_currency: "Select Deduction Currency",
                choose_currency: "Choose Currency",
                available: "Available",
                needed: "Needed",
                deduct_amount: "Amount to deduct",
                current_balance: "Current balance",
                new_balance: "New balance",
                deduction_ready: "Deduction Ready",
                deduction_on_submit: "Deduction will be applied on submit",
                insufficient_balance_for: "Insufficient balance for",
                confirm_auto_deductions: "Confirm Auto Deductions",
                system_will_deduct: "System will deduct",
                from_available_balances: "from available balances",
                deductions_ready: "Deductions Ready",
                deductions_on_submit: "Deductions will be applied on submit",
                sender_required: "Sender is required",
                cod_required: "COD is required",
                no_cod_values: "No COD values found",
                cancel: "Cancel",
                confirm_deduction: "Confirm Deduction",
                confirm_return: "Confirm Return",
                confirm_balance_return: "Confirm Balance Return",
                return_balance_confirmation: "Do you want to return the previously deducted amounts to the sender's balance?",
                yes: "Yes",
                no: "No",
                ok: "OK",
                currency_mismatch: "Currency mismatch error",
                exceed_balance: "Exceed Balance Limit",
                exceed_balance_desc: "Allow exceeding balance limit",
                balance_confirmation: "Balance Confirmation",
                balance_change_confirmation: "This action will affect the sender's balance. Do you want to continue?",
                return_balance: "Return Balance",
                deduction_amounts: "Amounts to deduct",
                balance_after: "Balance after",
                auto_deduction_notice: "Automatic Deduction Notice",
                auto_deduction_message: "This order type will be automatically deducted from your balance upon submission.",
                auto_deduction_message_payment: "This order type will be automatically deducted from your balance upon submission."
              }
            },
            client:{
              title:"Client",
              fields:{
                found:"Found it automatically",
                client:"Client",
                name:"Name",
                firstPhone:"Phone Number",
                secondPhone:"Second Phone Number",
                city:"City",
                area:"Area",
                address:"Address",
                searchReceiver:"Search Receiver",
                enterPhone:"Enter phone number",
                noReceivers:"No receivers found",
                found:"Found",
                receivers:"receivers",
                search_error:"Please enter a valid phone number",
                no_results:"No results found",
                enter_more:"Enter at least 3 numbers for search",
                add_new:"Add new receiver",
                enter_valid_phone:"Please enter a valid phone number",
                add_new_receiver:"Add new receiver",
                unnamed:"Unnamed",
                search_receiver:"Search receiver",
                search_placeholder:"Enter phone number"
              }
            },
            cost:{
              title:"Cost",
              fields:{
                "netValue": "Net Value",
                checks:"Checks",
                packageCost:"Package Cost",
                amount:"Amount",
                deliveryFee:"Delivery Fee",
                isReplaced:"Is Replaced",
                insufficient_balance:"Insufficient Balance",
                balance:"Current balance",
                insufficient_balance_alert:"is not sufficient for this transaction",
                missing_fields:"Missing Fields",
                fields_required:"Receiver, delivery fee, or COD value are required"
              }
            },
            details:{
              title:"Order Details",
              paymentDetailsTitle:"Payment Details",
              fields:{
                description:"Description",
                product:"Product",
                quantity:"Quantity",
                weight:"Weight",
                orderType:"Order Type"
              }
            },
            orderTypes:{
              title:"Order Type",
              titlePlaceholder:"Select Order Type",
              delivery:"Delivery",
              receive:"Receive",
              "delivery/receive":"Delivery / Recieve",
              payment:"Payment",
              receivedItems:"Received Items",
              receivedQuantity:"Received Quantity",
            },
            itemsContentTypeList:{
              "normal":"Noraml",
              "large":"Large",
              "extra_large":"Extra Large",
              "fragile":"Fragile",
              "high_value":"high_value"
            },
            currencyList:{
              title:"Currency",
              ILS:"ILS",
              USD:"USD",
              JOD:"JOD"
            },
            paymentType:{
              title:"Payment Method",
              cash:"Cash",
              check:"Check",
              "cash/check":"Cash/Check"
            },
            itemsCotnentType:{
              title:"Items Content Type",
              normal:"Noraml"
            },
            notes:{
              title:"Notes",
              note:"Note"
            },
            checks:{
              add:"Add Check",
              check:"Check",
              number:"Number",
              value:"Value",
              currency:"Currency",
              date:"Date"
            }
          },
          "validation": {
              "required": "There are missing fields, please fill them"
            }
        }
      },
      collections:{
        title:"Collections",
        close:"Close",
        options:{
          "driver_money_collections":"Driver Money Collections",
          "business_money_collections":"Busienss Money Collections",
          "driver_returned_collections":"Driver Returned/Received Collections",
          "business_returned_collections":"Business Returned/Recieved Collections",
          "runsheet_collections":"Runsheet Collections",
          "sent_collections":"Sent Collections",
          "my_money_collections":"My Money Collections",
          "my_returned_collections":"My Returned/Received Collections",
          "driver_own_collections":"My Money collections collected from businesses",
          "driver_own_sent_collections":"My Sent collection to businesses"
        }
      },
      settings:{
        title:"Settings",
        options:{
          users:"Users",
          language:{
            title:"Language",
            options:{
              ar:"Arabic",
              en:"English",
              he:"Hebrew"
            }
          },
          theme:{
            title:"Theme",
            options:{
              light:"Light",
              dark:"Dark",
              system:"System"
            }
          },
          complaints:"Complaints",
          changePassword:"Change Password",
          changePasswordFields:{
            currentPasswordRequired:"Current password is required",
            newPasswordRequired:"New password is required",
            passwordValidationRequired:"Password must be at least 8 characters",
            confirmPasswordRequired:"Please confirm your password",
            passwordMatchValidation:"Passwords do not match",
            success:"Success",
            successMsg:"Your password has been changed successfully",
            changePass:"Change Password",
            tips:"Security Tips",
            usage:"Use at least 8 characters",
            letterInclusion:"Include uppercase letters",
            numbersInclusion:"Include numbers and symbols",
            currentPass:"Current Password",
            currentPassHint:"Enter current password",
            newPass:"New Password",
            newPassHint:"Enter new password",
            confirmPassword:"Confirm Password",
            weak:"Week",
            medium:"Medium",
            strong:"Strong",
            veryStrong:"Very Strong",
            updating:"Updating..."
          },
          contactUs:"Contact Us",
          aboutUs:"About Us",
          locations:"Locations",
          logout:"Logout",
          preferences:"Preference",
          support:"Support",
          account:"Account",
          deleteAccount:"Delete Account",
          deleteAccountHint:"This action will delete your account and all your data will be lost.",
          driverStats:"Driver Statistics",
          switchAccount:"Switch Account",
          otherAccounts:"Other Accounts",
          addNewAccount:"Add New Account",
          currentAccount:"Current Account",
          active:"Active",
          addAccount:"Add Account",
          addNewAccount:"Add New Account",
          accountSwitched:"Account Switched",
          accountSwitchedMessage:"Account switched successfully",
          accountAlreadyExists:"Account already exists",
          accountAdded:"Account Added",
          accountAddedMessage:"Account added successfully",
          removeAccount:"Remove Account",
          removeAccountMessage:"Are you sure you want to remove this account? You can add it again later.",
          cancel:"Cancel",
          remove:"Remove",
          driverStats: "Driver Statistics"
        }
      }
    },

    // (collection)
    collections:{
      title:"Collections",
      emptyArray:"No Collections to show",
      filters:{
        //filterByGroup
        all:"All",
        returnedInBranch:"Returned In Branch",
        deleted:"Deleted",
        returnedOut:"Returned Out",
        returnedDelivered:"Returned Delivered",
        completed:"Completed",
        moneyInBranch:"Money In Branch",
        moneyOut:"Money Out",
        paid:"Paid",
        pending:"Pending",
        inDispatchedToBranch:"In Dispatched To Branch",
        partial:"Partial",
        returnedDelivered:"Returned Delivered",
        // searchByGroup
        collectionId:"Collection ID",
        sender:"Sender",
        driver:"Driver",
        prevDriver:"Previous Driver",
        currentBranch:"Current Branch",
        // searchByDateGroup
        today:"Today",
        yesterday:"Yesterday",
        thisWeek:"This Week",
        thisMonth:"This Month",
        thisYear:"This Year",
        selectDate:"Select a Date"
      },
      collection:{
        numberOfOrders:"Number of Orders",
        numberOfCollections:"Number of Collections",
        moneyToDeliver:"Money to Deliver",
        moneyToCollect:"Total COD Value",
        checksToDeliver:"Checks to Deliver",
        currentBranch:"Current Branch",
        toBranch:"To Branch",
        print:"Print",
        collections:"Collections",
        totalDeductions: "Total Deductions",
        scanToConfirm: "Scan to Confirm",
        finalAmount: "Received Amount",
        orders:"Orders",
        actions:"Actions",
        businessName: "Business Name",
        businessPhone: "Business Phone",
        businessLocation: "Business Location",
        request_money:"Request your Money",
        prepare_money:"Prepare my Money",
        send_money:"Send the money to me",
        request_package:"Request your Package",
        prepare_package:"Prepare my Package",
        send_package:"Send the package to me",
        confirmPaymentMessage:"By making this process, you are confirming that you received the money, and the company is no longer holding any responsibility about later complaints",
        cancel:"Cancel",
        confirm:"Confirm",
        confirmReturnedMessage:"By doing this, you confirm that you have received the package, and that the company no longer bears any responsibility for subsequent complaints regarding its receipt.",
        confirmTitle:"Confirm Reception",
        pendingConfirmations:"Pending Confirmations",
        moneyCollections:"Money Collections",
        packageCollections:"Package Collections",
        noCollectionsToConfirm:"No collections to confirm",
        collectionId:"Collection ID",
        orderIds:"Order IDs",
        totalNetValue:"Total Net Value",
        confirmPayment:"Confirm Payment",
        confirmDelivery:"Confirm Delivery",
        partialSuccess:"Partial Success",
        updatedCollections:"Updated Collections",
        success:"Success",
        statusUpdated:"Status Updated",
        failedCollections:"Failed Collections",
        error:"Error",
        tryAgainLater:"Please try again later",
        deliveryType:"Delivery Type",
        orderCount:"Order Count",
        whatsappOptions:"Whatsapp Options",
        sentMoney:"Sent Money",
        sentPackages:"Sent Packages"
      }
    },

    // (users)
    users:{
      title:"Users",
      emptyArray:"No Users to show",
      filters:{
        // filterByGroup
        all:"All",
        active:"Active",
        inactive:"Inactive",
        //searchByGroup
        userId:"User ID",
        name:"Name",
        commercial:"Commercial Name",
        email:"Email",
        phone:"Phone",
        branch:"Branch",
        role:"Role",
        city:"City",
        area:"Area",
        address:"Address",
        //searchByDateGroup
        today:"Today",
        yesterday:"Yesterday",
        thisWeek:"This Week",
        thisMonth:"This Month",
        thisYear:"This Year",
        selectDate:"Select a Date",
      },
      user:{
        name:"Name",
        role:"Role",
        edit:"Edit",
        location:"Location",
      },
      //(create_user)
      create:{
        edit:"Edit User",
        create:"Create User",
        submit:"Submit",
        loading:"Loading...",
        error:"Error",
        errorValidationMsg:"Please check the highlighted fields",
        errorMsg:"An unexpected error occurred, Please call the support agent to help",
        success:"Success",
        successMsg:"Proccess has been done Successfully",
        sections:{
          user:{
            title:"user",
            fields:{
              name:"Name",
              commercial:"Commercial Name",
              firstPhone:"Phone Number",
              secondPhone:"Second Phone Number",
              affillator:"Affillator",
              city:"City",
              area:"Area",
              address:"Address",
            }
          },
          details:{
            title:"Details",
            fields:{
              role:"Role",
              pricelist:"Price List",
              branch:"Branch",
              manager:"Manager"
            }
          }
        }
      }
    },

    complaints:{
      title:"Complaints",
      complaint:"Complaint",
      complaintId:"Complaint ID",
      createdBy:"Created By",
      supportAgent:"Support Agent",
      submit_complaint:"Submit Complaint",
      openComplaint:"Open a Complaint for order",
      subject:"Subject",
      description:"Description",
      describe:"Describe your complaint...",
      submit:"Send",
      success:"Success",
      error:"Error",
      employeeName:"Employee Name",
      successMsg:"Complaint submitted successfully.",
      errorMsg:"Failed to submit complaint.",
      errorFailed:"Something went wrong.",
      errorValidationMsg:"Please fill in all fields",
      orderId:"Order ID",
      resolved:"Resolved",
      status:"Status",
      createdAt:"Created At",
      messagePlaceholder:"Type your message...",
      notFound:"Complaint not found",
      //searchByDateGroup
      today:"Today",
      yesterday:"Yesterday",
      thisWeek:"This Week",
      thisMonth:"This Month",
      thisYear:"This Year",
      selectDate:"Select a Date",
      status:{
        title: "Status",
        all:"All",
        open:"Open",
        closed:"Closed"
      },
      ok:"Ok",
      order:"Order",
      subjectPlaceholder:"Enter subject",
      describePlaceholder:"Describe your issue",
      noComplaints:"No Complaints Found",
      noComplaintsDesc:"There are no complaints matching your filters.",
      newComplaint:"New Complaint",
      actions:"Actions",
      markAsResolved:"Mark as Resolved",
      respond:"Respond to Complaint",
      viewDetails:"View Details",
      loading:"Loading...",
      notFoundTitle:"Not Found",
      goBack:"Go Back",
      issue:"Issue",
      conversation:"Conversation",
      noMessages:"No messages yet",
      startConversation:"Start the conversation by sending a message",
      you:"You",
      supportAgent:"Support Agent"
    },

    // Notifications
    notifications:{
      title:"Notifications",
      deleteAll:"Delete All",
      noNotifications:"No Notifications",
      noNotificationsTitle:"No Notifications",
      order:"Order",
      loading:"Loading...",
      newNotification:"New Notification",
      appNotification:"App Notification",
      orderNotification:"Order Notification",
      newNotificationMessage:"You have a new notification",
      confirmation:{
        processing:"Processing...",
        pleaseWait:"Please wait...",
        success:"Success",
        error:"Error",
        confirm:"Confirm",
        ok:"OK",
        errorFailed:"Something went wrong",
        errorValidationMsg:"Please fill in all fields",
        cancelled:"Cancelled",
        cancelledMessage:"The request has been cancelled.",
        successMessage:"Your confirmation has been processed successfully.",
        transactionId:"Transaction ID",
        title:"Confirmation Required",
        message:"Do you want to confirm this request?",
        confirm:"Confirm",
        cancel:"Cancel"
      }
    },

    routes: {
      title: "Routes",
      routeDetails: "Route Details",
      navigation: "Route Navigation",
      activeTabs: "Active Routes",
      completedTabs: "Completed",
      noActiveRoutes: "No active routes",
      noCompletedRoutes: "No completed routes",
      createRoutePrompt: "Create a new route to organize your deliveries",
      createRoute: "Create New Route",
      create: "Create Route",
      edit: "Edit",
      navigate: "Navigate",
      routeName: "Route Name",
      enterRouteName: "Enter route name",
      orders: "Orders",
      optimized: "Optimized",
      completed: "Completed",
      addOrders: "Add Orders",
      optimize: "Optimize",
      listView: "List View",
      mapView: "Map View",
      noOrders: "No orders in this route",
      addOrdersPrompt: "Add orders to create your delivery route",
      dragInstructions: "Long press and drag to reorder",
      markAsCompleted: "Mark as Completed",
      saveRoute: "Save Route",
      removeOrder: "Remove Order",
      removeOrderConfirm: "Are you sure you want to remove this order from the route?",
      errorLoadingRoute: "Error loading route details",
      cannotModifyCompleted: "Cannot modify a completed route",
      needMoreOrders: "You need at least 2 orders to optimize a route",
      optimizationFailed: "Failed to optimize route",
      routeOptimizedMessage: "Your route has been optimized for the most efficient delivery sequence.",
      alreadyCompleted: "This route is already completed",
      emptyRouteCompletion: "Cannot complete an empty route",
      completeRoute: "Complete Route",
      completeRouteConfirm: "Are you sure you want to mark this route as completed? This action cannot be undone.",
      completionFailed: "Failed to complete route",
      routeCompleted: "Route marked as completed successfully",
      errorAddingOrders: "Failed to add orders to route",
      errorRemovingOrder: "Failed to remove order from route",
      saveFailed: "Failed to save route",
      routeSaved: "Route saved successfully",
      yourLocation: "Your Location",
      noAvailableOrders: "No available orders",
      checkOrders: "Check your orders page for available deliveries",
      delivered: "Delivered",
      stop: "Stop",
      map: "Map",
      list: "List",
      orderId: "Order ID",
      phone: "Phone",
      call: "Call",
      whatsapp: "WhatsApp",
      regularCall: "Regular Call",
      cancel: "Cancel",
      changeStatus: "Update Status",
      selectStatus: "Select Status",
      selectReason: "Select Reason",
      confirmStatusChange: "Confirm Status Change",
      confirmStatusChangeMessage: "Are you sure you want to change the status to",
      reason: "Reason",
      statusChangeNotAllowed: "Cannot change status for this order",
      errorUpdatingStatus: "Failed to update status",
      deleteRouteTitle: "Delete Route",
      deleteRouteConfirm: "Are you sure you want to delete this route? This action cannot be undone.",
      routeDeleted: "Route deleted successfully",
      error: "Error",
      accessDeniedMessage: "This feature is only available for drivers and delivery companies.",
      routeNotFound: "Route not found",
      locationPermission: "Location Permission",
      locationNeeded: "Location permission is needed for navigation.",
      dispatchTo: "Dispatch to",
      message: "Message"
    },

    // Search
    search:{
      placeholder:"Search",
      by:"By",
      searchBy:"Search By",
      searchByDate:"Search By Date",
      cancel:"Cancel",
      confirm:"Confirm",
      results:"results"
    },

    // pickerModal
    picker:{
      choose:"Choose a",
      cancel:"Cancel",
      searchPlaceholder:"Search",
      clear:"Clear"
    },

    // (camera)
    camera:{
      permission:{
        grant:"Grant Permission",
        notGranted:"Camera permission not granted",
        request:"Requesting camera permission...",
      },
      scanText:"Position barcode within frame",
      scanDuplicateTextError:"Item already scanned",
      scanInvalidTextError:"Invalid scan format",
      scanAgainTapText:"Tap to Scan Again",
      note:"Leave a note...",
      fromBranch:"From Branch",
      toBranch:"To Branch",
      branch:"Branch",

      confirm:"Confirm",
      cancel:"Cancel",
      totalScanned:"Total Scanned",
      enterOrderId:"Ebter order ID",
      toDriver:"To Driver",
      add:"Add",
      scanOrEnterOrderId:"Scan a barcode or enter an order ID above",
      selectDriverFrom: "Select Driver",
      selectDriver: "Select Driver",
      driverSelectionRequired: "Please select a driver"
    },

    // (change_password)
    chnagePassword:{
      title:"Change Passowrd",
      currentPass:"Current Password",
      currentPassHint:"Enter your current password used for login",
      newPass:"New Password",
      changePass:"Change Password"
    },

    // (contact_us)
    contact:{
      title:"Contact Us",
      open:"Open",
      closed:"Closed",
      weAre:"We Are",
      now:"Now",
      local:"Local",
      facebook:"Facebook",
      tiktok:"Tiktok",
      instagram:"Instagram",
      whatsapp:"Whatsapp",
      visitSite:"Visit Out Website",
      openingHours:"Opening hours: 9:00 AM - 10:00 PM",
      closingHours:"We'll be back tomorrow at 9:00 AM",
      connectWithUs:"Connect With Us"
    },

    // (about_us)
    about:{
      title:"About Us",
      aboutLabel:"About Tayar Company",
      aboutDesc:"At Tayar, we specialize in high-quality package delivery across the West Bank, Jerusalem, and the land of 48. Our mission is to provide fast, reliable, and secure shipping solutions tailored to your needs. Whether it's business deliveries or personal shipments, we ensure every package reaches its destination safely and on time.With a commitment to excellence and customer satisfaction, Tayar is your trusted partner for seamless logistics. Experience hassle-free delivery with a team that prioritizes efficiency and care.",
    },

    // (locations)
    locations:{
      title:"Locations",
      tulkarm:{
        title:"Tulkarm",
        desc:"The main location hub"
      },
      hebron:{
        title:"Hebron",
        desc:"Delivery hub in Hebron"
      },
      ramallah:{
        title:"Ramallah",
        desc:"Delivery hub in Ramallah"
      },
      jenin:{
        title:"Jenin",
        desc:"Delivery hub in Jenin"
      }
    },

    // greeting
    greeting:{
      morning:"Good Morning! ☀️",
      afternoon:"Good Afternoon! 🌤️",
      evening:"Good Evening! 🌙"
    },

    // track
    track:{
      title:"Track Your Order",
      desc:"Enter Order Number to Start Tracking",
      placeholder:"for ex:12321411",
    },

    roles: {
      admin: "Admin",
      business: "Business",
      manager: "Manager",
      driver: "Driver",
      accountant: "Accountant",
      entery: "Entry",
      warehouse_admin: "Warehouse Admin",
      warehouse_staff: "Warehouse Staff",
      delivery_company: "Delivery Company",
      support_agent: "Support Agent",
      sales_representative: "Sales Representative"
    },
    
     // Add options onboarding
     assignOrdersTitle: "Assign Orders",
     assignOrdersMessage: "Use this option to scan QR codes for orders and assign them to your vehicle. This helps you organize deliveries efficiently.",
     routesTitle: "Manage Routes",
     createOrdersTitle: "Create Orders",
     createOrdersMessage: "Create new orders quickly and efficiently.",
     routesMessage: "Create and manage delivery routes to improve your delivery operations. Plan your route, track progress as you complete orders, and move efficiently between delivery locations.",
    
    // Home screen hints
    homeHints: {
      trackOrder: {
        title: "Track Orders",
        businessMessage: "Quickly track any order by entering its reference number. Get real-time status updates and delivery information.",
        driverMessage: "Quickly look up any order by scanning or entering its reference number to verify delivery details.",
        deliveryCompanyMessage: "Quickly track any order in your system by entering its reference number for real-time status information."
      },
      checkReceiver: {
        title: "Check Receiver",
        businessMessage: "Verify receiver information and see their order history before creating new shipments.",
        driverMessage: "Verify receiver information and check their previous delivery history before attempting delivery.",
        deliveryCompanyMessage: "Verify receiver information and view their order history to better manage your delivery operations."
      },
      orderSummary: {
        title: "Order Summary",
        businessMessage: "Get a quick overview of all your orders. Tap any card to see detailed information about orders in that status.",
        driverMessage: "See a summary of orders assigned to you. Tap any card to view orders in that specific status.",
        deliveryCompanyMessage: "Get a comprehensive overview of all orders in your system. Monitor performance across different status categories."
      },
      balance: {
        title: "Financial Balance",
        businessMessage: "Monitor your available balance in different currencies. Tap to see transaction history and manage your funds.",
        driverMessage: "Check your current balance from collections. Tap to see detailed transaction history.",
        deliveryCompanyMessage: "Track your company's financial balance across multiple currencies. Tap to view detailed transaction records."
      },
      collections: {
        title: "Collections Management",
        businessMessage: "Confirm money and package collections. Long-press on summary cards to request money or package collection services.",
        driverMessage: "Manage money and package collections from customers and businesses.",
        deliveryCompanyMessage: "Manage money collections and returned packages across your delivery network."
      },
      statusOverview: {
        title: "Status Overview",
        businessMessage: "Visual representation of your order statuses. The percentage shows the proportion of orders in each status.",
        driverMessage: "Visual breakdown of your delivery statuses. Keep track of your progress throughout the day.",
        deliveryCompanyMessage: "Visual analytics of order statuses across your delivery network. Monitor efficiency and identify bottlenecks."
      },
      skip: "Skip All",
      next: "Next",
      finish: "Got It"
    }
  },
  ar: {
    // Common translations
    common: {
      createNew:"إنشاء طرد",
      loading: "جاري التحميل...",
      retry: "إعادة المحاولة",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تعديل",
      add: "إضافة",
      search: "بحث",
      noResults: "لا توجد نتائج",
      error: "خطأ",
      success: "نجاح",
      ok: "موافق",
      next: "التالي",
      skip: "تخطي",
      finish: "إنهاء",
      someUpdatesFailed:"بعض التحديثات فشلت",
      updateError:"خطأ في تحديث",
    },
    
    // Driver and delivery company onboarding
    onboarding: {
      assignOrdersTitle: "تعيين الطلبات",
      assignOrdersMessage: "استخدم هذا الخيار لمسح رموز QR للطلبات وتعيينها إلى مسارك. يساعدك ذلك على تنظيم عمليات التوصيل بكفاءة وتتبع الطرود طوال عملية التوصيل.",
      routesTitle: "إدارة المسارات",
      createOrdersTitle: "إنشاء طرد",
      createOrdersMessage: "إنشاء طرد جديد بسهولة. قم بإدخال المعلومات المطلوبة وأنشئ طردك الآن.",
      routesMessage: "إنشاء وإدارة مسارات التوصيل لتحسين عمليات التوصيل الخاصة بك. خطط لرحلتك، وتتبع التقدم أثناء إكمال الطلبات، وتنقل بكفاءة بين مواقع التوصيل.",
      
      // Orders onboarding tutorial
      orders: {
        welcome: {
          title: "مرحبًا بك في شاشة الطرود!",
          description: "دعنا نوضح كيفية إدارة طرودك بكفاءة."
        },
        expand: {
          title: "توسيع وطي",
          description: "اضغط على زر السهم لتوسيع أو طي الطرد لرؤية المزيد أو أقل من التفاصيل."
        },
        track: {
          title: "تتبع الطرود",
          description: "اضغط على أي طلب لرؤية معلومات التتبع التفصيلية وتاريخه."
        },
        status: {
          title: "تغيير الحالة",
          description: "اضغط مطولاً على الطرد أو اضغط على شارة الحالة لتحديث حالة الطرد."
        },
        edit: {
          title: "تعديل الطرود",
          description: "اضغط مطولاً على الطرد للوصول إلى خيارات تعديل تفاصيل الطرد."
        },
        phone: {
          title: "تعديل رقم الهاتف",
          description: "اضغط مطولاً على الطرد للوصول إلى خيار تعديل أرقام هواتف المستلم."
        },
        complaint: {
          title: "فتح شكوى",
          description: "اضغط مطولاً على الطرد واختر 'تقديم شكوى' للإبلاغ عن مشكلات في طردك."
        },
        tapToExpand: "اضغط للتوسيع"
      }
    },
    
    // Add driver statistics translations
    driverStats: {
      title: "إحصائيات السائق",
      count: "العدد",
      deliveryFee: "رسوم التوصيل",
      codValue: "قيمة الدفع عند الاستلام",
      ordersChart: "توزيع الطلبات",
      dateRange: "نطاق التاريخ",
      selectPeriod: "اختر الفترة",
      periods: {
        day: "يوم",
        week: "أسبوع",
        month: "شهر",
        half_year: "٦ أشهر",
        year: "سنة"
      },
      statuses: {
        delivered: "تم التسليم",
        returned: "مرتجع",
        on_the_way: "قيد التوصيل",
        total: "المجموع"
      }
    },
    
    // Create order onboarding
    createOnboarding: {
      welcome: {
        title: "مرحبًا بك في واجهة انشاء طردك!",
        message: "دعنا نشرح لك سريعا على عملية إنشاء طرد جديد. استخدم أزرار التنقل."
      },
      orderTypes: {
        title: "اختر نوع طردك",
        message: "اختر نوع الطرد الذي تحتاجه:\n\n• توصيل: إرسال الطرود إلى زبائنك.\n• احضار: استلام طرد من الزبون وتسليمه لك. يرجى ملاحظة أن هذا النوع يتطلب وجود رصيد في حسابك لدينا، أو دفع قيمة الطرد في أحد فروعنا قبل تنفيذ الطلب.\n• توصيل / تبديل: توصيل طرد إلى الزبون مع استلام طرد آخر منه في نفس الوقت.\n• دفع: تسليم مبلغ مالي لزبونك. هذا النوع يتطلب وجود رصيد كافٍ في حسابك أو إيداع المبلغ في أحد فروعنا قبل تنفيذ العملية. "
      },
      reference: {
        title: "الرقم المرجعي",
        message: "قمنا باعتماد طريقة جديدة للتبع طردك بكل سهولة, حيث نقوم بتوفير اكواد QR جاهزة لك لتضعها على الطرد لتتمكن من التتبع بسهولة"
      },
      client: {
        title: "معلومات الزبون",
        message: "أدخل تفاصيل الاتصال بالمستلم بما في ذلك الاسم وأرقام الهاتف والمدينة والعنوان. عند كتابة رقم هاتف المستلم في حال وجود ذلك المستلم مسبقا في قاعدة البيانات لدينا فسيتم اظهاره لك لتتمكن من اختياره بسهولة"
      },
      cost: {
        title: "تكلفة الطرد",
        message: "يمكنك اختيار طريقة الدفع التي سيستخدمها زبونك عند توصيل أو استلام الطرد، سواء كانت نقدًا (كاش) أو شيكًا، أو كليهما معًا إذا كنت ترغب في ذلك. كما يمكنك إضافة أكثر من عملة إذا كنت تفضل استلام المدفوعات بعملة مختلفة أو بأكثر من عملة."
      },
      netValue: {
        title: "حساب القيمة الصافية",
        message: "سيتم عرض القيمة الصافية باللون الأخضر، وهي تمثل المبلغ المستحق لك بعد خصم رسوم التوصيل."
      },
      details: {
        title: "تفاصيل الطرد",
        message: "قم بكتابة تفاصيل الطرد لاحظ ان هذه الحقول اختيارية ويمكنك تركها فارغة"
      },
      notes: {
        title: "ملاحظات إضافية",
        message: "أضف أي تعليمات خاصة أو معلومات قد تساعد في التوصيل أو التعامل مع هذا الطلب."
      },
      ready: {
        title: "جاهز للانطلاق!",
        message: "أنت جاهز الآن! انقر على زر ارسال عندما تكمل جميع المعلومات المطلوبة لإنشاء طردك."
      },
      back: "السابق",
      next: "التالي",
      skip: "تخطي الشرح",
      finish: "ابدأ الآن"
    },
    
    // (auth)
    auth: {
      login: "تسجيل الدخول",
      dontHaveAccount: "ليس لديك حساب؟",
      register: "تسجيل",
      username: "اسم المستخدم",
      mobileNumber: "رقم الهاتف",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      city: "المدينة",
      area: "المنطقة",
      address: "العنوان",
      comercialName:"الاسم التجاري",
      registerSuccess:"لقد قمت بإنشاء حسابك بنجاح، يرجى تسجيل الدخول الآن",
      registrationFailed:"لم يتم انشاء حسابك بنجاح",
      loginFailed:"لم يتم تسجيل الدخول بنجاح",
      phonePlaceholder: "أدخل رقم هاتفك",
      passwordPlaceholder: "أدخل كلمة المرور",
      biometricLoginFailed: "فشل تسجيل الدخول بالبصمة",
      noPreviousLogin: "يرجى تسجيل الدخول باستخدام بياناتك أولاً لتفعيل تسجيل الدخول بالبصمة",
      biometricPrompt: "تسجيل الدخول باستخدام البصمة",
      cancel: "إلغاء",
      biometricFailed: "فشل التحقق",
      credentialsNotFound: "لم يتم العثور على بيانات تسجيل الدخول المحفوظة",
      phoneRequired: "رقم الهاتف مطلوب",
      passwordRequired: "كلمة المرور مطلوبة",
      welcome: "مرحباً بعودتك",
      signMessage: "سجّل الدخول إلى حسابك",
      loginWithBiometric: "تسجيل الدخول بالبصمة",
      or: "أو",
      forgotPassword: "نسيت كلمة المرور؟",
      register: "تسجيل حساب",
      usernamePlaceholder: "أدخل اسمك الكامل",
      emailPlaceholder: "أدخل بريدك الإلكتروني (اختياري)",
      phonePlaceholder: "أدخل رقم هاتفك",
      passwordPlaceholder: "ادخل كلمة مرور",
      confirmPasswordPlaceholder: "أكد كلمة المرور",
      comercialNamePlaceholder: "أدخل اسم نشاطك التجاري",
      businessActivity: "نوع النشاط التجاري",
      businessActivityPlaceholder: "ماذا تبيع / تقدم؟ (اختياري)",
      cityPlaceHolder: "اختر مدينتك",
      areaPlaceholder: "أدخل منطقتك",
      addressPlaceholder: "أدخل عنوانك",
      secondPhone: "رقم هاتف إضافي",
      secondPhonePlaceholder: "أدخل رقم هاتف بديل (اختياري)",
      website: "الموقع الإلكتروني",
      websitePlaceholder: "أدخل رابط موقعك الإلكتروني (اختياري)",
      tiktok: "تيك توك",
      facebook: "فيسبوك",
      instagram: "انستغرام",
      tiktokPlaceholder: "أدخل اسم مستخدم تيك توك (اختياري)",
      facebookPlaceholder: "أدخل صفحة الفيسبوك الخاصة بك (اختياري)",
      instagramPlaceholder: "أدخل حسابك على انستغرام (اختياري)",
      personalInfo: "المعلومات الشخصية",
      businessDetails: "تفاصيل النشاط التجاري",
      socialMedia: "مواقع التواصل الاجتماعي",
      nameRequired: "الاسم مطلوب",
      passwordValidation: "يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل",
      passwordConfirmation: "يرجى تأكيد كلمة المرور",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      businessNameRequired: "اسم النشاط التجاري مطلوب",
      cityRequired: "المدينة مطلوبة",
      noFields: "لا توجد حقول متاحة في هذه الخطوة",
      successRegiser: "تم التسجيل بنجاح",
      back: "السابق",
      next: "التالي",
      createAccount: "إنشاء حساب",
      step: "الخطوة",
      of: "من",
      role:{
        title:"الدور",
        business:"تاجر",
        driver:"سائق"
      }
    },

    errors:{
      error:"خطأ",
      success:"تم بنجاح",
      failedToParse:"فشل في تحليل الاستجابة من الخادم. يرجى المحاولة مرة أخرى.",
      requestTimedOut:"انتهى وقت الطلب. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
      requestAborted:"تم إيقاف الطلب. يرجى المحاولة مرة أخرى.",
      unexpectedError:"حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      pleaseSelectStatus:"يرجى اختيار حالة",
      pleaseSelectReason:"يرجى اختيار سبب",
      pleaseSelectBranch:"يرجى اختيار فرع",
      noItemsScanned:"لا توجد طلبات مسجلة",
    },

    "check": {
    "receiver": {
      "title": "التحقق من المستلم",
      "desc": "أدخل رقم الهاتف للتحقق من وجود المستلم",
      "placeholder": "أدخل رقم الهاتف",
      "results": "نتائج البحث",
      "noResults": "لم يتم العثور على مستلم بهذا الرقم",
      "totalOrders": "إجمالي الطلبات",
      "returnedOrders": "المرتجعات",
      "comment": "ملاحظات"
    }
  },

    driverNotification:{
      title:"إشعار السائقين بوجود طرود جاهزة للاستلام",
      cancel:"إلغاء",
      send:"إرسال",
      sendNotification:"إرسال الإشعار",
      sending:"يتم إرسال الإشعار...",
      sent:"تم إرسال الإشعار",
      error:"فشل إرسال الإشعار",
      selectDrivers:"اختر السائقين",
      selectDriversMessage:"يرجى اختيار السائقين الذين تريد إشعارهم.",
      success:"تم بنجاح",
      errorMessage:"فشل إرسال الإشعار",
      notificationSent:"تم إرسال الإشعار بنجاح",
    },

    routes: {
      title: "المسارات",
      routeDetails: "تفاصيل المسار",
      navigation: "التنقل في المسار",
      activeTabs: "المسارات النشطة",
      completedTabs: "المكتملة",
      noActiveRoutes: "لا توجد مسارات نشطة",
      noCompletedRoutes: "لا توجد مسارات مكتملة",
      createRoutePrompt: "قم بإنشاء مسار جديد لتنظيم عمليات التوصيل الخاصة بك",
      createRoute: "إنشاء مسار جديد",
      create: "إنشاء مسار",
      edit: "تعديل",
      navigate: "تنقل",
      routeName: "اسم المسار",
      enterRouteName: "أدخل اسم المسار",
      orders: "الطلبات",
      optimized: "تم التحسين",
      completed: "مكتمل",
      addOrders: "إضافة طلبات",
      optimize: "تحسين",
      listView: "عرض القائمة",
      mapView: "عرض الخريطة",
      noOrders: "لا توجد طلبات في هذا المسار",
      addOrdersPrompt: "أضف طلبات لإنشاء مسار التوصيل الخاص بك",
      dragInstructions: "اضغط مطولاً واسحب لإعادة الترتيب",
      markAsCompleted: "تحديد كمكتمل",
      saveRoute: "حفظ المسار",
      removeOrder: "إزالة الطلب",
      callOptions: "اختيار الاتصال",
      whatsapp: "واتساب",
      regularCall: "اتصال عادي",
      cancel: "إلغاء",
      removeOrderConfirm: "هل أنت متأكد من أنك تريد إزالة هذا الطلب من المسار؟",
      errorLoadingRoute: "خطأ في تحميل تفاصيل المسار",
      cannotModifyCompleted: "لا يمكن تعديل مسار مكتمل",
      needMoreOrders: "تحتاج إلى طلبين على الأقل لتحسين المسار",
      optimizationFailed: "فشل في تحسين المسار",
      routeOptimizedMessage: "تم تحسين مسارك للحصول على تسلسل التوصيل الأكثر كفاءة.",
      alreadyCompleted: "هذا المسار مكتمل بالفعل",
      emptyRouteCompletion: "لا يمكن إكمال مسار فارغ",
      completeRoute: "إكمال المسار",
      completeRouteConfirm: "هل أنت متأكد من أنك تريد تحديد هذا المسار كمكتمل؟ لا يمكن التراجع عن هذا الإجراء.",
      completionFailed: "فشل في إكمال المسار",
      routeCompleted: "تم تحديد المسار كمكتمل بنجاح",
      errorAddingOrders: "فشل في إضافة الطلبات إلى المسار",
      errorRemovingOrder: "فشل في إزالة الطلب من المسار",
      saveFailed: "فشل في حفظ المسار",
      routeSaved: "تم حفظ المسار بنجاح",
      yourLocation: "موقعك الحالي",
      noAvailableOrders: "لا توجد طلبات متاحة",
      checkOrders: "تحقق من صفحة الطلبات للتوصيلات المتاحة",
      delivered: "تم التوصيل",
      stop: "محطة",
      map: "خريطة",
      list: "قائمة",
      orderId: "رقم الطلب",
      phone: "الهاتف",
      call: "اتصال",
      changeStatus: "تحديث الحالة",
      selectStatus: "اختر الحالة",
      selectReason: "اختر السبب",
      confirmStatusChange: "تأكيد تغيير الحالة",
      confirmStatusChangeMessage: "هل أنت متأكد أنك تريد تغيير الحالة إلى",
      reason: "السبب",
      statusChangeNotAllowed: "لا يمكن تغيير حالة هذا الطلب",
      errorUpdatingStatus: "فشل في تحديث الحالة",
      deleteRouteTitle: "حذف المسار",
      deleteRouteConfirm: "هل أنت متأكد من أنك تريد حذف هذا المسار؟ لا يمكن التراجع عن هذا الإجراء.",
      routeDeleted: "تم حذف المسار بنجاح",
      error: "خطأ",
      accessDeniedMessage: "هذه الميزة متاحة فقط للسائقين وشركات التوصيل.",
      routeNotFound: "المسار غير موجود",
      locationPermission: "إذن الموقع",
      locationNeeded: "إذن الموقع مطلوب للتنقل.",
      dispatchTo: "إرسال إلى",
      message: "رسالة"
    },

    common:{
      createNew:"إنشاء طرد",
      delete:"حذف",
      cancel:"إلغاء",
      confirm:"تأكيد",
      save:"حفظ",
      close:"اغلاق",
      edit:"تعديل",
      view:"عرض",
      success:"تم بنجاح",
      error:"خطأ",
      search:"ابحث",
      add:"إضافة",
      complete:"مكتمل",
      selectOption:"اختر",
      assignOrders:"تعيين الطرود",
      loadingOrders:"جارٍ التحميل...",
      retry:"حاول مرة أخرى",
      loading:"جارٍ التحميل...",
      loadingMore:"جارٍ التحميل...",
      pending:"معلق",
      gotIt:"فهمت",
      skip:"تخطي",
      next:"التالي",
      refresh:"تحديث",
      finish:"إنهاء",
      someUpdatesFailed:"بعض التحديثات فشلت",
      updateError:"خطأ في تحديث",
    },

    balance:{
      balanceHistory:"سجل الحركات",
      "paymentType": "عملية دفع",
      "transactionType": "معاملة",
      "otherType": "تعديل",
      "balanceAfter": "الرصيد بعد العملية",
      "currentBalance": "الرصيد الحالي",
      "noTransactions": "لم يتم العثور على معاملات",
      "loading": "جارٍ التحميل"
    },

    // (tabs)
    tabs: {
      index: {
        title: "الرئيسية",
        summaryTitle:"ملخص الطرود",
        statusTitle:"نظرة عامة",
        boxes: {
          todayOrders: "طلبات اليوم",
          moneyInBranches: "المال في الفروع",
          readyMoney:"المال الجاهز للاستلام",
          readyOrders:"الطرود المرتجع/المستبدل الجاهزة للاستلام",
          moneyInBranch: "المال في الفرع",
          moneyWithDrivers: "المال مع السائقين",
          moneyWithDriver: "المال التي بحوزتي",
          inWaiting: "في الانتظار",
          inBranch: "في الفرع",
          onTheWay: "في الطريق",
          delivered: "تم التوصيل",
          returned: "مرتجع",
          rescheduled: "مؤجل",
          returnedInBranch: "مرتجع في الفرع",
          replacedDeliveredOrders: "تم تبديلها",
          stuck: "عالق",
          rejected: "مرفوض",
          ofOrders: "من الطرود",
          withDriver: "بعهدة السائق"
        },
        balanceTitle:"رصيدك",
        balance:{
          available:"الرصيد الحالي",
        }
      },
      orders: {
        title: "الطرود",
        emptyArray: "لا توجد طلبات لعرضها",
        filters: {
          // filterByGroup
          all: "الكل",
          todayOrders: "طلبات اليوم",
          waiting: "في الانتظار",
          rejected: "مرفوض",
          inBranch: "في الفرع",
          inProgress: "قيد التنفيذ",
          stuck: "عالق",
          delayed: "متأخر",
          onTheWay: "في الطريق",
          replacedDeliveredOrders: "تم تبديلها",
          driverResponsibilityOrders: "بعهدة السائق",
          rescheduled: "مؤجل",
          returnBeforeDeliveredInitiated: "مرجع قبل الوصول",
          returnAfterDeliveredInitiated: "مرجع بعد الوصول",
          returned: "مرتجع",
          returnedInBranch: "مرتجع في الفرع",
          returnedOut: "جاري تسليم المرتجع / التبديل",
          businessReturnedDelivered: "تم تسليم المرتجع / التبديل للتاجر",
          delivered: "تم التوصيل",
          moneyInBranch: "المال في الفرع",
          moneyOut: "جاري تسليم المال",
          businessPaid: "مدفوع",
          completed: "مكتمل",
          received:"تم الاحضار",
          "delivered/received":"تم التوصيل / تم التبديل",
          dispatched_to_branch:"نقل الى الفرع المرسل اليه",
          // searchByGroup
          orderId: "معرف الطرد",
          referenceID: "معرف المرجع",
          sender: "المرسل",
          receiverName: "اسم الزبون",
          receiverPhone: "هاتف الزبون",
          receiverCity: "مدينة الزبون",
          receiverArea: "منطقة الزبون",
          receiverAddress: "عنوان الزبون",
          driverName: "اسم السائق",
          // searchByDateGroup
          today: "اليوم",
          yesterday: "الأمس",
          thisWeek: "هذا الأسبوع",
          thisMonth: "هذا الشهر",
          thisYear: "هذا العام",
          selectDate: "اختر تاريخًا"
        },
        track: {
          orderTracking: "تتبع الطرد",
          order: "الطرد",
          package: "الحزمة",
          quantity: "الكمية",
          weight: "الوزن",
          receivedItems: "العناصر المستلمة",
          receivedQuantity: "الكمية المستلمة",
          deliveryStatus: "حالة التوصيل",
          branch: "الفرع",
          issue: "هل لديك مشكلة؟ قدم شكوى",
          openCase: "فتح شكوى",
          unknown: "غير معروف",
          "loading": "جارٍ التحميل...",
          "errorTitle": "عذرًا!",
          "orderNotFound": "لم يتم العثور على الطلب أو تعذر تحميله",
          "goBack": "العودة",
          "tryAgain": "حاول مرة أخرى",
          "receiverInfo": "معلومات المستلم",
          "name": "الاسم",
          "mobile": "الجوال",
          "secondMobile": "جوال إضافي",
          "location": "الموقع",
          "address": "العنوان",
          "senderInfo": "معلومات المرسل",
          "orderDetails": "تفاصيل الطلب",
          "orderType": "نوع الطلب",
          "paymentType": "طريقة الدفع",
          "referenceId": "الرقم المرجعي",
          "itemType": "نوع الطرد",
          "driver": "السائق",
          "financialDetails": "التفاصيل المالية",
          "codValue": "تكلفة الدفع عند الاستلام",
          "deliveryFee": "تكلفة التوصيل",
          "netValue": "الصافي للتاجر",
          "checks": "الشيكات",
          "checkNumber": "رقم الشيك",
          "checkValue": "قيمة الشيك",
          "checkDate": "تاريخ الشيك",
          "notes": "ملاحظات",
          "packageDetails": "تفاصيل الطرد",
          "package": "الطرد",
          "quantity": "الكمية",
          "weight": "الوزن",
          "receivedItems": "العناصر المستلمة",
          "receivedQuantity": "الكمية المستلمة",
          "deliveryStatus": "حالة التوصيل",
          "needHelp": "تحتاج إلى مساعدة",
          "openCase": "تقديم شكوى"
        },
        "order": {
          "states": {
            "on_the_way_back": "اعادته الى قيد التوصيل",
            "pickedUp": "تم الاحضار",
            "deliveredToDestinationBranch": "تم التوصيل إلى الفرع الوجهة",
            "rejected": "مرفوض",
            "cancelled": "ملغي",
            "stuck": "عالق",
            "rescheduled": "مؤجل",
            "on_the_way": "تعيين سائق",
            "dispatched_to_branch": "ارسال الى فرع اخر",
            "return_before_delivered_initiated": "مرجع قبل الوصول",
            "return_after_delivered_initiated": "مرجع بعد الوصول",
            "return_after_delivered_fee_received": "مرجع بعد الوصول وتم استلام اجرة التوصيل",
            "delayed": "متأخر",
            "failedToUpdate": "فشل تحديث الحالة",
            "forOrders": "للطرود",
            "referenceIdUpdated": "تم تحديث الرقم المرجعي بنجاح",
            "referenceIdUpdateError": "فشل تحديث الرقم المرجعي",
            "suspendReasons": {
              "closed": "مغلق",
              "no_response": "لا يوجد رد",
              "cancelled_from_office": "ملغي من المكتب",
              "address_changed": "تم تغيير العنوان",
              "not_compatible": "غير متوافق للمواصفات",
              "delivery_fee_issue": "لا يريد دفع تكلفة التوصيل",
              "duplicate_reschedule": "طلب تأجيل متكرر",
              "receive_issue": "لا يريد الاستلام",
              "sender_cancelled": "ملغي من المرسل",
              "reschedule_request": "المستلم طلب تأجيل الاستلام",
              "incorrect_number": "رقم غير صحيح",
              "not_existing": "المستلم غير موجود في البلد",
              "cod_issue": "لا يريد دفع تكلفة الطرد",
              "death_issue": "المستلم لديه حالة وفاة",
              "not_exist_in_address": "المستلم غير موجود في العنوان المطلوب تسليمه", 
              "receiver_cancelled": "ملغي من المستلم",
              "receiver_no_response": "لا يوجد رد من المستلم",
              "order_incomplete": "الطرد غير مكتمل",
              "receive_request_issue": "المستلم لم يطلب الطرد",
              "other": "سبب اخر"
            },
            "delivered": "تم التوصيل",
            "waiting": "في الانتظار",
            "inBranch": "في الفرع",
            "inProgress": "قيد التنفيذ",
            "delivered": "تم التوصيل",
            "received": "تم الاحضار",
            "delivered_received": "تم التوصيل / تم التبديل"
          },
          "editPhone": "تعديل",
          "receiverAddress": "عنوان المستلم",
          "codValue": "قيمة الطرد",
          "codUpdateReason": "سبب تغيير قيمة الطرد",
          "enterReason": "أدخل سبب التغيير",
          "codUpdateNote": "ملاحظة: يتطلب تغيير قيمة الطرد موافقة المرسل",
          "loading": "جاري التحميل...",
          "codValue": "تكلفة الطرد",
          "error": "خطأ",
          "errorFetchingOrder": "خطأ في جلب بيانات الطلب",
          "ok": "موافق",
          "phoneUpdateSuccess": "تم تحديث أرقام الهاتف بنجاح",
          "receiverDetailsUpdateSuccess": "تم تحديث بيانات المستلم بنجاح",
          "codUpdateRequestSuccess": "تم إرسال طلب تغيير قيمة الطرد بنجاح, سوف يتم اشعارك عند الموافقة",
          "receiverPhones": "هواتف المستلم",
          "loading": "جاري التحميل...",
          "error": "خطأ",
          "errorFetchingOrder": "خطأ في جلب بيانات الطلب",
          "ok": "موافق",
          "missingStatus": "لم يتم تحديد حالة",
          "selectReason": "اختر السبب",
          "statusChangeSuccess": "تم تحديث الحالة بنجاح",
          "statusChangeError": "فشل في تحديث الحالة",
          "selectBranch": "اختر الفرع",
          "reason": "السبب",
          "branch": "الفرع",
          "orderType": "نوع الطرد",
          "unknown": "غير معروف",
          "userSenderBoxLabel": "المرسل",
          "userClientBoxLabel": "العميل",
          "userDriverBoxLabel": "السائق",
          "userBoxPhoneContactLabel": "اتصال",
          "userBoxMessageContactLabel": "رسالة",
          "contactPhone": "الهاتف",
          "contactWhatsapp": "واتساب",
          "edit": "تعديل",
          "status":"الحالة",
          "selectStatus":"اختر الحالة",
          "confirmStatusChange":"هل أنت متأكد من أنك تريد تعيين تلك الطرود بعهدتك ؟",
          "changeStatus": "تغيير الحالة",
          "changeStatusAlert": "أنت على وشك تغيير حالة الطرد إلى",
          "changeStatusAlertNote": "اكتب ملاحظة...",
          "changeStatusAlertConfirm": "تأكيد",
          "changeStatus": "تغيير الحالة",
          "changeStatusAlertCancel": "إلغاء",
          "print": "طباعة",
          "location": "الموقع",
          "to_branch":"مرسل الى الفرع",
          "to_driver":"مرسل الى السائق",
          "financialDetails": "التفاصيل المالية",
          "codValue": "تكلفة الطرد",
          "netValue": "المطلوب للتاجر",
          "deliveryFee": "تكلفة التوصيل",
          "checksAvailable": "الشيكات المتاحة",
          "note": "ملاحظة",
          "add_currency": "إضافة عملة أخرى",
          "success": "نجاح",
          "orderActions": "إجراءات الطلب",
          "receivedItems": "العناصر المستلمة",
          "receivedQuantity": "الكمية المستلمة",
          "enterReferenceId":"أدخل الرقم المرجعي",
            "referenceIdHelper":"يمكنك إدخاله أو قراءته بالضغط على الكود الباركود",
            "referenceIdPlaceholder":"أدخل الرقم المرجعي",
            "scan":"مسح",
            "skip":"تخطي",
            "save":"حفظ",
            "referenceIdRequired":"الرقم المرجعي مطلوب",
          "noteRequiredForOther": "ملاحظة مطلوبة عند اختيار سبب \"آخر\"",
          "statusChangeOffline": "سيتم تحديث الحالة عند الاتصال بالانترنت",
          "resend":"اعادة الارسال الى مستلم اخر",
          "orderChecks": {
            "addCheck": "إضافة شيك",
            "title": "شيكات الطلب",
            "orderId": "رقم الطلب",
            "loading": "جاري التحميل...",
            "totalChecks": "إجمالي الشيكات",
            "totalValue": "القيمة الإجمالية",
            "check": "شيك",
            "value": "القيمة",
            "checkNumberPlaceholder": "أدخل رقم الشيك",
            "number": "الرقم",
            "currency": "العملة",
            "date": "التاريخ",
            "noChecks": "لا توجد شيكات",
            "noChecksMessage": "لا توجد شيكات مرتبطة بهذا الطلب.",
            "backToOrder": "رجوع",
            "checkDetails": "تفاصيل الشيك",
          }
        },
        validation: {
          required: "تأكد من ادخال جميع الحقول"
        },
        save: "حفظ التغييرات",
        cancel: "إلغاء",
        error: "خطأ",
        success: "نجاح",
        errorMsg: "حدث خطأ",
        errorValidationMsg: "يرجى تصحيح الأخطاء في النموذج",
        // (create)
        create: {
          edit: "تعديل الطرد",
          create: "إنشاء طلب",
          submit: "إرسال",
          loading: "جارٍ التحميل...",
          success:"نجحت العملية",
          successMsg:"تم تسجيل طردك بنجاح",
          error: "خطأ",
          errorValidationMsg: "يرجى التحقق من الحقول المشار اليها بخطأ",
          errorMsg: "حدث خطأ غير متوقع، يرجى الاتصال بوكيل الدعم للمساعدة",
          insufficientBalance:"رصيد غير كافٍ",
          insufficientBalanceMsg:"رصيدك غير كافى لإتمام هذه العملية",
          "save": "حفظ التغييرات",
          "cancel": "إلغاء",
          "phoneUpdateSuccess": "تم تحديث أرقام الهاتف بنجاح",
          "receiverDetailsUpdateSuccess": "تم تحديث بيانات المستلم بنجاح",
          sections: {
            referenceId:{
              title:"الرقم المرجعي (اختياري)",
              explain:"ضع رقم QR الخاص بك ان كان متوفرا"
            },
            sender: {
              title: "المرسل",
              fields: {
                "sender": "المرسل",
                "with_money_receive": "مع استلام مبلغ مالي",
                "my_balance_deduct": "خصم من رصيدي",
                "sender_deduct": "خصم من رصيد المرسل",
                "processing_return": "جاري معالجة الإرجاع",
                "please_wait": "يرجى الانتظار...",
                "return_success": "تم الإرجاع بنجاح",
                "balance_returned": "تم إعادة الرصيد بنجاح",
                "return_error": "خطأ في الإرجاع",
                "return_failed": "فشل في إرجاع الرصيد",
                "deduction_error": "خطأ في الخصم",
                "deduction_failed": "فشل في معالجة الخصم",
                "updating_deductions": "جاري تحديث الخصومات",
                "update_deduction_failed": "فشل في تحديث الخصومات",
                "deduction_success": "تم الخصم بنجاح",
                "deduction_processed": "تم تنفيذ الخصم بنجاح",
                "processing_deduction": "جاري معالجة الخصم",
                "select_deduction_method": "اختر طريقة الخصم",
                "choose_deduction_method": "اختر كيفية خصم الرصيد",
                "manual_deduction": "خصم يدوي",
                "auto_deduction": "خصم تلقائي",
                "checking_balance": "جاري التحقق من الرصيد",
                "select_deduction_currency": "اختر عملة الخصم",
                "choose_currency": "اختر العملة",
                "available": "متوفر",
                "needed": "مطلوب",
                "deduct_amount": "المبلغ المراد خصمه",
                "current_balance": "الرصيد الحالي",
                "new_balance": "الرصيد الجديد",
                "deduction_ready": "الخصم جاهز",
                "deduction_on_submit": "سيتم تطبيق الخصم عند الإرسال",
                "insufficient_balance_for": "الرصيد غير كافٍ لـ",
                "confirm_auto_deductions": "تأكيد الخصومات التلقائية",
                "system_will_deduct": "سيقوم النظام بخصم",
                "from_available_balances": "من الأرصدة المتوفرة",
                "deductions_ready": "الخصومات جاهزة",
                "deductions_on_submit": "سيتم تطبيق الخصومات عند الإرسال",
                "sender_required": "مطلوب إدخال المرسل",
                "cod_required": "مطلوب ادخال سعر الطرد",
                "no_cod_values": "لم يتم العثور على قيم الدفع عند الاستلام",
                "cancel": "إلغاء",
                "confirm": "تأكيد",
                "confirm_deduction": "تأكيد الخصم",
                "confirm_return": "تأكيد الإرجاع",
                "confirm_balance_return": "تأكيد إعادة الرصيد",
                "return_balance_confirmation": "هل تريد إعادة المبالغ المخصومة سابقًا إلى رصيد المرسل؟",
                "yes": "نعم",
                "no": "لا",
                "ok": "موافق",
                "currency_mismatch": "خطأ في تطابق العملة",
                "exceed_balance": "تجاوز حد الرصيد",
                "exceed_balance_desc": "السماح بتجاوز حد الرصيد",
                "balance_confirmation": "تأكيد الرصيد",
                "balance_change_confirmation": "سيؤثر هذا الإجراء على رصيد المرسل. هل ترغب في المتابعة؟",
                "return_balance": "إعادة الرصيد",
                "deduction_amounts": "المبالغ المطلوب خصمها",
                "balance_after": "الرصيد بعد",
                "auto_deduction_notice": "ملاحظة خصم تلقائي",
                "auto_deduction_message": "طرد احضار سوف يتم الخصم تلقائيا من رصيدك عند التأكيد, في حال لم يكن لديك رصيد كافي الرجاء التوجه الى أفرب فرع لدفع قيمة هذه العملية لدى موظف الاستقبال.",
                "auto_deduction_message_payment": "طرد دفع سوف يتم الخصم تلقائيا من رصيدك عند التأكيد, في حال لم يكن لديك رصيد كافي الرجاء التوجه الى أفرب فرع لدفع قيمة هذه العملية لدى موظف الاستقبال."
              }
            },
            client: {
              title: "الزبون",
              fields: {
                found:"تم ايجاده تلقائيا",
                name:"الاسم",
                client: "الزبون",
                firstPhone: "رقم الهاتف",
                secondPhone: "رقم الهاتف الثاني",
                city: "المدينة",
                area: "المنطقة",
                address: "العنوان",
                searchReceiver:"ابحث عن الزبون",
                enterPhone:"ادخل رقم الهاتف",
                noReceivers:"لا يوجد زبائن",
                found:"تم ايجاد",
                receivers:"زبائن",
                search_error:"يجب ادخال رقم هاتف صالح",
                no_results:"لا يوجد زبائن",
                enter_more:"ادخل 3 ارقام على الأقل للبحث",
                add_new:"اضافة زبون جديد",
                enter_valid_phone:"ادخل رقم هاتف صالح",
                add_new_receiver:"اضافة زبون جديد",
                unnamed:"غير معروف",
                search_receiver:"أدخل هاتف الزبون",
                search_placeholder:"ادخل رقم الهاتف"
              }
            },
            cost: {
              title: "التكلفة",
              fields: {
                "netValue": "القيمة الصافية",
                "checks":"الشيكات",
                "packageCost": "سعر الطرد غير شامل التوصيل",
                "totalPackageCost": "سعر الطرد شامل التوصيل",
                "amount": "المبلغ",
                "deliveryFee": "رسوم التوصيل",
                "isReplaced": "تم استبداله",
                "insufficient_balance": "رصيد غير كافٍ",
                "balance": "الرصيد الحالي",
                "insufficient_balance_alert": "غير كافٍ لإتمام هذه العملية",
                "missing_fields": "حقول ناقصة",
                "fields_required": "يجب إدخال بيانات المستلم أو رسوم التوصيل أو قيمة الدفع عند الاستلام"
              }
            },
            details: {
              title: "تفاصيل الطرد",
              paymentDetailsTitle:"تفاصيل الدفع",
              fields: {
                description:"الوصف",
                product: "المنتج",
                quantity: "عدد التوابع",
                weight: "الوزن",
                orderType: "نوع الطرد"
              }
            },
            orderTypes: {
              title: "نوع الطرد",
              titlePlaceholder:"اختر نوع الطرد",
              delivery: "توصيل",
              receive: "احضار",
              "delivery/receive": "توصيل / تبديل",
              payment: "دفع",
              receivedItems: "العناصر المستلمة",
              receivedQuantity: "الكمية المستلمة"
            },
            currencyList: {
              title: "العملة",
              ILS: "شيكل",
              USD: "دولار",
              JOD: "دينار"
            },
            itemsContentTypeList:{
              "normal": "عادي",
              "large": "كبير",
              "extra_large": "كبير جداً",
              "fragile": "قابل للكسر",
              "high_value": "ذو قيمة عالية"
            },
            paymentType: {
              title: "طريقة الدفع",
              cash: "نقدًا",
              check: "شيك",
              "cash/check": "نقدًا/شيك"
            },
            itemsCotnentType: {
              title: "نوع محتوى العناصر",
              normal: "عادي"
            },
            notes: {
              title: "ملاحظات",
              note: "ملاحظة"
            },
            checks:{
              add:"اضافة شيك",
              check:"شيك",
              number:"الرقم",
              value:"المبلغ",
              currency:"العملة",
              date:"التاريخ"
            }
          },
            "validation": {
              required: "تأكد من ادخال جميع الحقول"
          }
        }
      },
      collections: {
        title: "التجميعات",
        close:"اغلاق",
        options: {
          "driver_money_collections": "التحصيلات المالية من السائقين",
          "business_money_collections": "التحصيلات المالية للتجار",
          "driver_returned_collections": "تجميعات المرتجعات/المستلم من السائقين",
          "business_returned_collections": "تجميعات المرتجعات/المستلم للتجار",
          "runsheet_collections": "تجميعات جاري التوصيل",
          "sent_collections": "التحصيلات المرسلة مع السائقين",
          "my_money_collections":"تحصيلاتي المالية",
          "my_returned_collections":"تجميعات المرتجعات/المستلم",
          "driver_own_collections":"تحصيلات أموالي المجمعة من التجار",
          "driver_own_sent_collections":"تحصيلات مرسلة للتجار"
        }
      },
      settings: {
        title: "الإعدادات",
        options: {
          users: "المستخدمون",
          language: {
            title: "اللغة",
            options: {
              ar: "العربية",
              en: "الإنجليزية",
              he: "العبرية"
            }
          },
          theme:{
            title:"المظهر",
            options:{
              light:"فاتح",
              dark:"داكن",
              system:"تلقائي"
            }
          },
          complaints: "الشكاوى",
          changePassword: "تغيير كلمة المرور",
          changePasswordFields: {
            currentPasswordRequired: "كلمة المرور الحالية مطلوبة",
            newPasswordRequired: "كلمة المرور الجديدة مطلوبة",
            passwordValidationRequired: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
            confirmPasswordRequired: "يرجى تأكيد كلمة المرور",
            passwordMatchValidation: "كلمتا المرور غير متطابقتين",
            success: "نجاح",
            successMsg: "تم تغيير كلمة المرور بنجاح",
            changePass: "تغيير كلمة المرور",
            tips: "نصائح الأمان",
            usage: "استخدم 8 أحرف على الأقل",
            letterInclusion: "تضمين حروف كبيرة",
            numbersInclusion: "تضمين أرقام ورموز",
            currentPass: "كلمة المرور الحالية",
            currentPassHint: "أدخل كلمة المرور الحالية",
            newPass: "كلمة المرور الجديدة",
            newPassHint: "أدخل كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور",
            weak: "ضعيفة",
            medium: "متوسطة",
            strong: "قوية",
            veryStrong: "قوية جدًا",
            updating: "جارٍ التحديث..."
          },          
          contactUs: "اتصل بنا",
          aboutUs: "عنّا",
          locations: "المواقع",
          logout: "تسجيل الخروج",
          deleteAccount: "حذف الحساب",
          deleteAccountHint: "هل أنت متأكد من حذف الحساب؟",
          driverStats: "إحصائيات السائق",
          switchAccount:"تبديل الحساب",
          otherAccounts:"حسابات أخرى",
          addNewAccount:"إضافة حساب جديد",
          currentAccount:"الحساب الحالي",
          active:"نشط",
          addNewAccount: "إضافة حساب جديد",
          addAccount:"إضافة حساب",
          addAccount:"إضافة حساب",
          accountSwitched:"تم تبديل الحساب",
          accountSwitchedMessage:"تم تبديل الحساب بنجاح",
          accountAlreadyExists:"الحساب موجود بالفعل",
          accountAdded:"حساب مضاف",
          accountAddedMessage:"تم إضافة الحساب بنجاح",
          removeAccount:"حذف الحساب",
          removeAccountMessage:"هل أنت متأكد من حذف الحساب؟ يمكنك إضافته مرة أخرى لاحقًا.",
          cancel:"إلغاء",
          remove:"حذف",
          driverStats: "إحصائيات السائق"
        }
      }
    },

    // (collection)
    collections: {
      title: "التجميعات",
      emptyArray: "لا توجد تجميعات لعرضها",
      filters: {
        // filterByGroup
        all: "الكل",
        returnedInBranch: "مرتجع في الفرع",
        deleted: "محذوف",
        returnedOut: "جاري تسليم المرتجع",
        returnedDelivered: "تم تسليم المرتجع",
        completed: "مكتمل",
        moneyInBranch: "المال في الفرع",
        moneyOut: "جاري تسليم المال",
        paid: "مدفوع",
        pending: "معلق",
        inDispatchedToBranch: "في مرحلة الإرسال إلى الفرع",
        partial: "جزئي",
        returnedDelivered: "تم تسليم المرتجع",
        // searchByGroup
        collectionId: "معرف التجميعة",
        sender: "المرسل",
        driver: "السائق",
        prevDriver: "السائق السابق",
        currentBranch: "الفرع الحالي",
        // searchByDateGroup
        today: "اليوم",
        yesterday: "الأمس",
        thisWeek: "هذا الأسبوع",
        thisMonth: "هذا الشهر",
        thisYear: "هذا العام",
        selectDate: "اختر تاريخًا"
      },
      collection: {
        numberOfOrders: "عدد الطرود",
        numberOfCollections: "عدد التجميعات",
        moneyToDeliver: "النقود للتسليم",
        moneyToCollect: "مجموع التحصيل المالي",
        checksToDeliver: "الشيكات للتسليم",
        currentBranch: "الفرع الحالي",
        toBranch: "الفرع المرسل إليه",
        print: "طباعة",
        collections: "التجميعات",
        businessName: "اسم التاجر",
        businessPhone: "هاتف التاجر",
        businessLocation: "الموقع",
        scanToConfirm: "مسح",
        orders: "الطرود",
        actions: "اختر اجراء",
        totalDeductions: "اجمالي الخصومات",
        finalAmount: "المبلغ المستلم",
        "request_money": "اطلب أموالك",
        "prepare_money": "تجهيز اموالي",
        "send_money": "أرسل الأموال إلي",
        "request_package": "اطلب طرودك",
        "prepare_package": "تجهيز طرودي",
        "send_package": "أرسل الطرود إلي",
        "confirmPaymentMessage": "بإتمام هذه العملية، فإنك تؤكد أنك استلمت المبلغ، وأن الشركة لم تعد مسؤولة عن أي شكاوى لاحقة",
        "cancel": "إلغاء",
        "confirm": "تأكيد",
        "confirmReturnedMessage": "بإجراء هذا، فإنك تؤكد أنك استلمت الطرد، وأن الشركة لم تعد تتحمل أي مسؤولية بخصوص أي شكاوى لاحقة حول استلامه.",
        confirmTitle:"تأكيد الاستلام",
        pendingConfirmations:"التأكيدات المعلقة",
        moneyCollections:"التحصيلات المالية",
        packageCollections:"تحصيلات الطرود",
        noCollectionsToConfirm:"لا توجد تجميعات لتأكيدها",
        collectionId:"معرف التجميعة",
        orderIds:"معرفات الطرود",
        totalNetValue:"القيمة الصافية الكلية",
        confirmPayment:"تأكيد الدفع",
        confirmDelivery:"تأكيد التسليم",
        partialSuccess:"نجاح جزئي",
        updatedCollections:"تم تحديث التجميعات",
        success:"نجاح",
        statusUpdated:"تم تحديث الحالة",
        failedCollections:"تجميعات لم يتم تحديثها بنجاح",
        error:"خطأ",
        tryAgainLater:"يرجى المحاولة مرة أخرى لاحقًا",
        deliveryType:"نوع التوصيل",
        orderCount:"عدد الطرود",
        whatsappOptions:"خيارات واتساب",
        sentMoney:"تحصيلات مرسلة للتجار",
        sentPackages:"تجميعات مرتجع / تبديل مرسلة للتجار "
      }
    },

    // (users)
    users: {
      title: "المستخدمون",
      emptyArray: "لا توجد مستخدمين لعرضهم",
      filters: {
        // filterByGroup
        all: "الكل",
        active: "نشط",
        inactive: "غير نشط",
        // searchByGroup
        userId: "معرف المستخدم",
        name: "الاسم",
        commercial: "الاسم التجاري",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        branch: "الفرع",
        role: "الدور",
        city: "المدينة",
        area: "المنطقة",
        address: "العنوان",
        // searchByDateGroup
        today: "اليوم",
        yesterday: "الأمس",
        thisWeek: "هذا الأسبوع",
        thisMonth: "هذا الشهر",
        thisYear: "هذا العام",
        selectDate: "اختر تاريخًا"
      },
      user: {
        name: "الاسم",
        role: "الدور",
        edit: "تعديل",
        location:"الموقع"
      },
      // (create_user)
      create: {
        edit: "تعديل المستخدم",
        create: "إنشاء مستخدم",
        submit: "إرسال",
        loading: "جارٍ التحميل...",
        error: "خطأ",
        errorValidationMsg: "يرجى التحقق من الحقول المميزة",
        errorMsg: "حدث خطأ غير متوقع، يرجى الاتصال بوكيل الدعم للمساعدة",
        success:"نجحت العملية",
        successMsg:"تم القيام بالعملية بنجاح",
        sections: {
          user: {
            title: "المستخدم",
            fields: {
              name: "الاسم",
              commercial: "الاسم التجاري",
              firstPhone: "رقم الهاتف",
              secondPhone: "رقم الهاتف الثاني",
              affillator: "التوقيع",
              city: "المدينة",
              area: "المنطقة",
              address: "العنوان"
            }
          },
          details: {
            title: "التفاصيل",
            fields: {
              role: "الدور",
              pricelist: "قائمة الأسعار",
              branch:"الفرع",
              manager:"مدير الحساب"
            }
          }
        }
      }
    },

    complaints: {
      title: "الشكاوى",
      complaint: "شكوى",
      complaintId: "معرف الشكوى",
      createdBy: "تم الإنشاء بواسطة",
      supportAgent: "وكيل الدعم",
      submit_complaint: "تقديم شكوى",
      openComplaint: "فتح شكوى للطلب",
      subject: "الموضوع",
      description: "الوصف",
      describe: "صف شكواك...",
      submit: "إرسال",
      success: "نجاح",
      error: "خطأ",
      employeeName: "اسم الموظف",
      successMsg: "تم تقديم الشكوى بنجاح.",
      errorMsg: "فشل في تقديم الشكوى.",
      errorFailed: "حدث خطأ ما.",
      errorValidationMsg: "يرجى ملء جميع الحقول",
      orderId: "معرف الطرد",
      resolved: "تم الحل",
      createdAt: "تم الإنشاء في",
      messagePlaceholder: "اكتب رسالتك...",
      notFound: "الشكوى غير موجودة",
      // searchByDateGroup
      today: "اليوم",
      yesterday: "الأمس",
      thisWeek: "هذا الأسبوع",
      thisMonth: "هذا الشهر",
      thisYear: "هذا العام",
      selectDate: "اختر تاريخًا",
      status: {
        title: "الحالة",
        all:"الكل",
        open:"مفتوح",
        closed:"مغلق"
      },
      ok:"موافق",
      order:"طلب",
      subjectPlaceholder:"ادخل الموضوع",
      describePlaceholder:"صف المشكلة",
      "noComplaints": "لا يوجد شكاوى",
      "noComplaintsDesc": "لا يوجد شكاوى تطابق الفلتر",
      "newComplaint": "شكوى جديدة",
      "actions": "الاجراءات",
      "markAsResolved": "تم حل الشكوى",
      "respond": "الرد على الشكوى",
      "viewDetails": "عرض التفاصيل",
      "loading": "جارٍ التحميل...",
      "notFoundTitle": "لم يتم العثور عليه",
      "goBack": "الرجوع",
      "issue": "مشكلة",
      "conversation": "محادثة",
      "noMessages": "لا يوجد رسائل",
      "startConversation": "ابدأ المحادثة بإرسال رسالة",
      "you": "أنت",
      "supportAgent": "وكيل الدعم"
    },

    // Notifications
    notifications:{
      title:"الاشعارات",
      deleteAll:"مسح الكل",
      noNotifications:"لا يوجد اشعارات",
      order:"طلب",
      noNotificationsTitle:"لا يوجد اشعارات",
      loading:"جارٍ التحميل...",
      newNotification:"اشعار جديد",
      newNotificationMessage:"لديك اشعار جديد",
      deleteAllConfirm:"هل أنت متأكد من أنك تريد مسح جميع الاشعارات؟",
      confirmation:{
        processing:"جارٍ المعالجة...",
        pleaseWait:"يرجى الإنتظار...",
        success:"نجاح",
        error:"خطأ",
        confirm:"تأكيد",
        ok:"موافق",
        errorFailed:"حدث خطأ ما",
        errorValidationMsg:"يرجى ملء جميع الحقول",
        cancelled:"إلغاء",
        cancelledMessage:"تم إلغاء الطلب",
        successMessage:"تم معالجة التأكيد بنجاح",
        transactionId:"معرف الطلب",
        title:"تأكيد مطلوب",
        message:"هل تريد تأكيد هذا الطلب؟",
        confirm:"تأكيد",
        cancel:"إلغاء",
        cod_update:{
          title:"تأكيد تعديل قيمة الطرد",
          message:"هل تريد تأكيد تعديل قيمة الطرد؟",
          approve:"تأكيد",
          reject:"رفض",
          successMessage:"تم تعديل قيمة الطرد بنجاح"
        },
        money_in:{
          title:"تأكيد معاملة دفع",
          message:"هل تريد تأكيد معاملة دفع؟",
          confirm:"تأكيد",
          cancel:"إلغاء",
          successMessage:"تم تأكيد المعاملة بنجاح",
          amount:"المبلغ",
          currency:"العملة",
          recipient:"المستلم"
        },
        money_out:{
          title:"تأكيد معاملة سحب",
          message:"هل تريد تأكيد معاملة سحب؟",
          confirm:"تأكيد",
          cancel:"إلغاء",
          successMessage:"تم تأكيد المعاملة بنجاح",
          amount:"المبلغ",
          currency:"العملة",
          recipient:"المستلم"
        }
      }
    },

    // Search
    search: {
      placeholder: "بحث",
      by: "حسب",
      searchBy: "البحث حسب",
      searchByDate: "البحث حسب التاريخ",
      cancel: "إلغاء",
      confirm: "تأكيد",
      all: "الكل",
      selectFilter: "اختر فلتر",
      results: "نتائج"
    },

    // pickerModal
    picker: {
      choose: "اختر",
      cancel: "إلغاء",
      searchPlaceholder: "بحث",
      clear: "مسح"
    },

    // (camera)
    camera: {
      permission: {
        notGranted: "لم يتم منح إذن الكاميرا",
        request: "جارٍ طلب إذن الكاميرا..."
      },
      scanText: "ضع الباركود داخل الإطار",
      scanReference: "امسح الباركود",
      scanDuplicateTextError: "العنصر تم مسحه مسبقًا",
      scanInvalidTextError: "تنسيق مسح غير صالح",
      scanAgainTapText: "اضغط للمسح مرة أخرى",
      note: "اترك ملاحظة...",
      fromBranch: "من الفرع",
      toBranch: "إلى الفرع",
      confirm: "تأكيد",
      branch:"الفرع",

      cancel: "إلغاء",
      totalScanned: "إجمالي الممسوح",
      enterOrderId:"ادخل الرقم التسلسلي للطرد",
      add:"اضافة",
      toDriver:"الى السائق",
      scanOrEnterOrderId:"ادخل رقم الطرد او ضع الباركود داخل الإطار",
      selectDriverFrom: "اختر السائق",
      selectDriver: "اختر السائق",
      driverSelectionRequired: "يرجى اختيار السائق"
    },

    // (change_password)
    chnagePassword: {
      title: "تغيير كلمة المرور",
      currentPass: "كلمة المرور الحالية",
      currentPassHint: "أدخل كلمة المرور الحالية المستخدمة لتسجيل الدخول",
      newPass: "كلمة المرور الجديدة",
      changePass: "تغيير كلمة المرور"
    },

    // (contact_us)
    contact: {
      title: "اتصل بنا",
      open: "تعمل",
      closed: "مغلقة",
      weAre: "مكاتبنا",
      now: "الآن",
      local: "محلي",
      facebook: "فيسبوك",
      tiktok: "تيكتوك",
      instagram: "انستقرام",
      whatsapp: "واتساب",
      visitSite: "زيارة موقعنا الإلكتروني",
      openingHours:"ساعات العمل: 9:00 صباحًا - 10:00 مساءً",
      closingHours:"سنعود غدًا الساعة 9:00 صباحًا",
      connectWithUs:"تواصل معنا"
    },

    // (about_us)
    about: {
      title: "عنّا",
      aboutLabel: "عن شركة طيار",
      aboutDesc: "في طيار، نحن متخصصون في توصيل الحزم عالية الجودة عبر الضفة الغربية والقدس وأراضي 48. مهمتنا هي تقديم حلول شحن سريعة وموثوقة وآمنة مصممة حسب احتياجاتك. سواء كانت توصيلات تجارية أو شحنات شخصية، نحن نضمن وصول كل حزمة إلى وجهتها بأمان وفي الوقت المحدد. مع التزامنا بالتميز ورضا الزبائن، طيار هو شريكك الموثوق لتجربة لوجستية سلسة. جرب التوصيل بدون متاعب مع فريق يعطي الأولوية للكفاءة والعناية."
    },

    // (locations)
    locations: {
      title: "المواقع",
      tulkarm: {
        title: "طولكرم",
        desc: "المركز الرئيسي"
      },
      hebron: {
        title: "الخليل",
        desc: "مركز التوصيل في الخليل"
      },
      ramallah: {
        title: "رام الله",
        desc: "مركز التوصيل في رام الله"
      },
      jenin: {
        title: "جنين",
        desc: "مركز التوصيل في جنين"
      }
    },

    // greeting
    greeting: {
      morning: "صباح الخير! ☀️",
      afternoon: "مساء الخير! 🌤️",
      evening: "مساء الخير! 🌙"
    },

    // track
    track: {
      title: "تتبع طردك",
      desc: "أدخل رقم الطرد لبدء التتبع",
      placeholder: "مثال: 12321411"
    },

    roles: {
      admin: "مدير",
      business: "تاجر",
      manager: "اداري",
      driver: "سائق",
      accountant: "محاسب",
      entery: "مدخل بيانات",
      warehouse_admin: "مدير المستودع",
      warehouse_staff: "موظف مستودع",
      delivery_company: "شركة توصيل",
      support_agent: "وكيل دعم",
      sales_representative: "مندوب مبيعات"
    },

    // Add options onboarding
    assignOrdersTitle: "تعيين الطلبات",
    assignOrdersMessage: "استخدم هذا الخيار لمسح رموز QR للطلبات وتعيينها إلى سيارتك. يساعدك هذا في تنظيم التسليمات بكفاءة.",
    routesTitle: "إدارة المسارات",
    routesMessage: "إنشاء وإدارة مسارات التوصيل لتحسين عمليات التوصيل. قم بتخطيط رحلتك وتتبع التقدم كلما أنجزت طلبات.",

    
    
    // Home screen hints
    homeHints: {
      trackOrder: {
        title: "تتبع طرودك",
        businessMessage: "تتبع أي طرد بسرعة عن طريق إدخال الرقم التسلسلي او المرجعي. احصل على تحديثات الحالة ومعلومات التوصيل في الوقت الفعلي.",
        driverMessage: "ابحث عن أي طلب بسرعة عن طريق المسح أو إدخال رقم المرجع للتحقق من تفاصيل التوصيل.",
        deliveryCompanyMessage: "تتبع أي طلب في نظامك بسرعة عن طريق إدخال رقم المرجع للحصول على معلومات الحالة في الوقت الفعلي."
      },
      checkReceiver: {
        title: "التحقق من المستلم",
        businessMessage: "تحقق من معلومات المستلم واطلع على سجل طلباته قبل ارسال طردك اليه.",
        driverMessage: "تحقق من معلومات المستلم وتاريخ التوصيل السابق قبل محاولة التوصيل.",
        deliveryCompanyMessage: "تحقق من معلومات المستلم وعرض سجل طلباته لإدارة عمليات التوصيل بشكل أفضل."
      },
      orderSummary: {
        title: "ملخص الطرود",
        businessMessage: "احصل على نظرة سريعة لجميع طرودك. انقر على أي بطاقة لمشاهدة معلومات مفصلة حول الطرود في تلك الحالة. اضغط كبسة مطولة لطلب تحصيل اموالك او طرودك المستلمة / المرتجعة.",
        driverMessage: "شاهد ملخصًا للطلبات المخصصة لك. انقر على أي بطاقة لعرض الطلبات في حالة معينة.",
        deliveryCompanyMessage: "احصل على نظرة شاملة لجميع الطلبات في نظامك. مراقبة الأداء عبر فئات الحالة المختلفة."
      },
      balance: {
        title: "الرصيد المالي",
        businessMessage: "مراقبة رصيدك المتاح بعملات مختلفة. انقر لمشاهدة سجلك المالي .",
        driverMessage: "تحقق من رصيدك الحالي من التحصيلات. انقر لمشاهدة سجلك المالي.",
        driverMessage: "تحقق من رصيدك الحالي من التحصيلات. انقر لمشاهدة سجلك المالي.",
      },
      collections: {
        title: "نأكيد الاستلام",
        businessMessage: "من هنا، يمكنك تأكيد أنك استلمت المبالغ المالية أو الطرود المستلمة / المرتجعة التي تم تسليمها إليك من قبل السائق او موظف الفرع، وذلك لضمان توثيق العملية وتحديث حالة الطلب في النظام.",
        driverMessage: "إدارة تحصيلات الأموال والطرود من العملاء والشركات.",
        deliveryCompanyMessage: "إدارة تحصيلات الأموال والطرود المرتجعة عبر شبكة التوصيل الخاصة بك."
      },
      statusOverview: {
        title: "نظرة عامة على الحالة",
        businessMessage: "يعرض هذا القسم تمثيلًا مرئيًا لحالات طلباتك، حيث تُوضح النسبة المئوية عدد الطلبات في كل حالة بشكل دقيق وسهل الفهم.",
        driverMessage: "يعرض هذا القسم تمثيلًا مرئيًا لحالات طلباتك، حيث تُوضح النسبة المئوية عدد الطلبات في كل حالة بشكل دقيق وسهل الفهم.",
        deliveryCompanyMessage: "يعرض هذا القسم تمثيلًا مرئيًا لحالات طلباتك، حيث تُوضح النسبة المئوية عدد الطلبات في كل حالة بشكل دقيق وسهل الفهم."
      },
      skip: "تخطي الكل",
      next: "التالي",
      finish: "فهمت"
    }
  },
  he: {
    // Driver and delivery company onboarding
    onboarding: {
      assignOrdersTitle: "הקצאת הזמנות",
      assignOrdersMessage: "השתמש באפשרות זו לסריקת קודי QR של הזמנות והקצאתם למסלול שלך. זה עוזר לך לארגן משלוחים ביעילות ולעקוב אחר חבילות לאורך תהליך המשלוח.",
      routesTitle: "ניהול מסלולים",
      routesMessage: "צור ונהל מסלולי משלוח לייעול המשלוחים שלך. תכנן את המסע שלך, עקוב אחר התקדמות בהשלמת הזמנות, ונווט ביעילות בין מיקומי המשלוח.",
    },
    
    // Add driver statistics translations
    driverStats: {
      title: "סטטיסטיקות נהג",
      count: "כמות",
      deliveryFee: "דמי משלוח",
      codValue: "ערך תשלום במסירה",
      ordersChart: "התפלגות הזמנות",
      dateRange: "טווח תאריכים",
      selectPeriod: "בחר תקופה",
      periods: {
        day: "יום",
        week: "שבוע",
        month: "חודש",
        half_year: "חצי שנה",
        year: "שנה"
      },
      statuses: {
        delivered: "נמסר",
        returned: "הוחזר",
        on_the_way: "בדרך",
        total: "סה״כ"
      }
    },
    
    // Create order onboarding
    createOnboarding: {
      welcome: {
        title: "ברוך הבא ליצירת הזמנות!",
        message: "בואו נעבור על תהליך יצירת הזמנה חדשה. החלק שמאלה להמשיך או השתמש בכפתורי הניווט."
      },
      orderTypes: {
        title: "סוגי הזמנות",
        message: "בחר את סוג ההזמנה שאתה צריך:\n\n• משלוח: שליחת חבילות ללקוחות\n• איסוף: קבלת פריטים מספקים\n• משלוח/החלפה: החלפת פריטים\n• תשלום: עסקאות כספיות בלבד"
      },
      reference: {
        title: "מספר סימוכין",
        message: "הוסף מזהה סימוכין ייחודי כדי לעקוב אחר הזמנה זו בקלות במערכת שלך. אתה יכול לסרוק ברקוד או להזין אותו ידנית."
      },
      client: {
        title: "פרטי לקוח",
        message: "הזן את פרטי הקשר של המקבל כולל שם, מספרי טלפון, עיר וכתובת. אתה יכול לחפש לקוחות קיימים או להוסיף חדשים."
      },
      cost: {
        title: "פרטי עלות",
        message: "הגדר שיטת תשלום (מזומן, צ'ק או שניהם), סכום תשלום במסירה ועמלות משלוח. אתה יכול להוסיף מטבעות נוספים במידת הצורך. הפעל \"חיוב מהיתרה\" לחשבונות עסקיים."
      },
      netValue: {
        title: "חישוב ערך נטו",
        message: "המערכת מחשבת אוטומטית את הערך הנטו על בסיס סכומי תשלום במסירה ועמלות משלוח. מטבעות שונים מוצגים בנפרד."
      },
      details: {
        title: "פרטי חבילה",
        message: "תאר מה נשלח, כמות, משקל וסוג חבילה. עבור הזמנות איסוף, פרט אילו פריטים אתה מצפה לקבל."
      },
      notes: {
        title: "הערות נוספות",
        message: "הוסף הוראות מיוחדות או מידע שעשוי לעזור במשלוח או בטיפול בהזמנה זו."
      },
      ready: {
        title: "מוכן לדרך!",
        message: "הכל מוכן! לחץ על כפתור השליחה כאשר מילאת את כל המידע הנדרש ליצירת ההזמנה שלך."
      },
      back: "חזרה",
      next: "הבא",
      skip: "דלג על המדריך",
      finish: "התחל"
    },

     // Add options onboarding
     assignOrdersTitle: "הגדר בקשות",
     assignOrdersMessage: "השתמש באפשרות זו כדי לסרוק קודי QR של בקשות ולהקצות אותן למסלול שלך. זה עוזר לך לארגן את המשלוחים בצורה אפקטיבית.",
     routesTitle: "הגדר מסלולים",
     routesMessage: "צור ונהל מסלולים של משלוחים כדי לשפר את המשלוחים שלך. צפה במסלול שלך, ועקב אחר ההתקדמות כאשר אתה משלים בקשות.",
 
     
     
     // Home screen hints
     homeHints: {
       trackOrder: {
         title: "עקוב אחר בקשות",
         businessMessage: "עקוב אחר כל בקשה בקלות על ידי הזנת מספר סימוכין או קוד QR. קבל עדכונים בזמן אמת על מצב הבקשה ופרטי המשלוח.",
         driverMessage: "חפש בקשה בקלות על ידי סריקת קוד QR או מספר סימוכין. קבל עדכונים בזמן אמת על מצב הבקשה ופרטי המשלוח.",
         deliveryCompanyMessage: "עקוב אחר כל בקשה בקלות על ידי סריקת קוד QR או מספר סימוכין. קבל עדכונים בזמן אמת על מצב הבקשה ופרטי המשלוח."
       },
       checkReceiver: {
         title: "בדיקת קבלת המשלוח",
         businessMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה.",
         driverMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה.",
         deliveryCompanyMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה."
       },
       orderSummary: {
         title: "סיכום בקשות",
         businessMessage: "קבל מעקב מהיר על כל הבקשות שלך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה. לחץ על כפתור ארוך כדי לבקש את הסכום המועסק או את הבקשות המוכנות לקבל.",
         driverMessage: "צפה בסיכום של הבקשות שמוקצות לך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
         deliveryCompanyMessage: "קבל מעקב מהיר על כל הבקשות שלך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה."
       },
       balance: {
         title: "סכום בקשות",
         businessMessage: "מעקב מהיר על כל הבקשות שלך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
         driverMessage: "צפה בסכום של הבקשות שמוקצות לך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
         driverMessage: "צפה בסכום של הבקשות שמוקצות לך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
       },
       collections: {
         title: "בדיקת קבלת המשלוח",
         businessMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה.",
         driverMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה.",
         deliveryCompanyMessage: "בדוק את פרטי הקבל וצפה בסימוכין שלו לפני ששליחת המשלוח אליו. בכך תוכל לוודא שהמשלוח מגיע למקבל בצורה נכונה."
       },
       statusOverview: {
         title: "סכום בקשות",
         businessMessage: "קבל מעקב מהיר על כל הבקשות שלך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
         driverMessage: "צפה בסכום של הבקשות שמוקצות לך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה.",
         deliveryCompanyMessage: "קבל מעקב מהיר על כל הבקשות שלך. לחץ על כל כרטיס כדי לצפות בפרטים מפורטים על הבקשות במצב זה."
       },
       skip: "דלג את המדריך",
       next: "הבא",
       finish: "התחל"
     },
    
    // (auth)
    auth: {
      login: "התחברות",
      dontHaveAccount: "אין לך חשבון?",
      register: "הרשמה",
      username: "שם משתמש",
      mobileNumber: "מספר טלפון",
      email: "אימייל",
      password: "סיסמה",
      city: "עיר",
      area: "אזור",
      address: "כתובת",
      comercialName:"שם מסחרי",
      registerSuccess:"יצרת בהצלחה את חשבונך, אנא התחבר כעת",
      registrationFailed:"החשבון שלך לא נוצר בהצלחה",
      loginFailed:"ההתחברות לא בוצעה בהצלחה",
      phonePlaceholder: "הזן את מספר הטלפון שלך",
      passwordPlaceholder: "הזן סיסמה",
      biometricLoginFailed: "התחברות ביומטרית נכשלה",
      noPreviousLogin: "אנא התחבר תחילה עם פרטיך כדי להפעיל התחברות ביומטרית",
      biometricPrompt: "התחברות באמצעות ביומטריה",
      cancel: "ביטול",
      biometricFailed: "אימות נכשל",
      credentialsNotFound: "פרטי התחברות שמורים לא נמצאו",
      phoneRequired: "נדרש מספר טלפון",
      passwordRequired: "נדרשת סיסמה",
      welcome: "ברוך שובך",
      signMessage: "היכנס לחשבון שלך",
      loginWithBiometric: "התחברות ביומטרית",
      or: "או",
      forgotPassword: "שכחת סיסמה?",
      register: "הרשמה",
      usernamePlaceholder: "הזן את שמך המלא",
      emailPlaceholder: "הזן אימייל (אופציונלי)",
      phonePlaceholder: "הזן מספר טלפון",
      passwordPlaceholder: "צור סיסמה",
      confirmPasswordPlaceholder: "אשר סיסמה",
      comercialNamePlaceholder: "הזן את שם העסק שלך",
      businessActivity: "סוג פעילות עסקית",
      businessActivityPlaceholder: "מה אתה מוכר/מציע? (אופציונלי)",
      cityPlaceHolder: "בחר עיר",
      areaPlaceholder: "הזן אזור",
      addressPlaceholder: "הזן כתובת",
      secondPhone: "מספר טלפון נוסף",
      secondPhonePlaceholder: "הזן מספר טלפון חלופי (אופציונלי)",
      website: "אתר אינטרנט",
      websitePlaceholder: "הזן קישור לאתר (אופציונלי)",
      tiktok: "טיקטוק",
      facebook: "פייסבוק",
      instagram: "אינסטגרם",
      tiktokPlaceholder: "הזן שם משתמש בטיקטוק (אופציונלי)",
      facebookPlaceholder: "הזן את עמוד הפייסבוק שלך (אופציונלי)",
      instagramPlaceholder: "הזן את חשבון האינסטגרם שלך (אופציונלי)",
      personalInfo: "מידע אישי",
      businessDetails: "פרטי עסק",
      socialMedia: "מדיה חברתית",
      nameRequired: "נדרש שם",
      passwordValidation: "הסיסמה חייבת להכיל לפחות 6 תווים",
      passwordConfirmation: "אנא אשר סיסמה",
      passwordMismatch: "הסיסמאות לא תואמות",
      businessNameRequired: "נדרש שם עסק",
      cityRequired: "נדרשת עיר",
      noFields: "אין שדות זמינים בשלב זה",
      successRegiser: "נרשמת בהצלחה",
      back: "קודם",
      next: "הבא",
      createAccount: "צור חשבון",
      step: "שלב",
      of: "מתוך",
      role:{
        title:"תפקיד",
        business:"עסק",
        driver:"נהג"
      }
    },

    errors:{
      error:"שגיאה",
      success:"בוצע בהצלחה",
      failedToParse:"שגיאה בטעינת פרטי הזמנה. אנא נסה שנית.",
      requestTimedOut:"הזמנה לא נגשה. אנא בדוק את החיבור שלך ונסה שנית.",
      requestAborted:"הזמנה בוטלה. אנא נסה שנית.",
      unexpectedError:"שגיאה בלתי צפויה. אנא נסה שנית.",
      pleaseSelectStatus:"אנא בחר סטטוס",
      pleaseSelectReason:"אנא בחר סיבה",
      pleaseSelectBranch:"אנא בחר סניף",
      noItemsScanned:"לא סרקו פריטים"
    },

    "check": {
    "receiver": {
      "title": "אימות נמען",
      "desc": "הזן מספר טלפון כדי לבדוק אם הנמען קיים",
      "placeholder": "הזן מספר טלפון",
      "results": "תוצאות חיפוש",
      "noResults": "לא נמצא נמען עם מספר זה",
      "totalOrders": "סה\"כ הזמנות",
      "returnedOrders": "החזרות",
      "comment": "הערות"
    }
  },

    driverNotification:{
      title:"הודעת נהגים על חבילות מוכנות לאיסוף",
      cancel:"ביטול",
      send:"שלח",
      sendNotification:"שלח הודעה",
      sending:"שולח הודעה...",
      sent:"הודעה נשלחה",
      error:"שליחת הודעה נכשלה",
      selectDrivers:"בחר נהגים",
      selectDriversMessage:"אנא בחר את הנהגים שברצונך להודיע להם.",
      success:"בוצע בהצלחה",
      errorMessage:"שליחת הודעה נכשלה",
      notificationSent:"הודעה נשלחה בהצלחה",
    },

    routes: {
      title: "מסלולים",
      routeDetails: "פרטי מסלול",
      navigation: "ניווט במסלול",
      activeTabs: "מסלולים פעילים",
      completedTabs: "הושלמו",
      noActiveRoutes: "אין מסלולים פעילים",
      noCompletedRoutes: "אין מסלולים שהושלמו",
      createRoutePrompt: "צור מסלול חדש כדי לארגן את משלוחיך",
      createRoute: "צור מסלול חדש",
      create: "צור מסלול",
      edit: "ערוך",
      navigate: "ניווט",
      routeName: "שם המסלול",
      enterRouteName: "הזן שם מסלול",
      orders: "הזמנות",
      optimized: "מותאם",
      completed: "הושלם",
      addOrders: "הוסף הזמנות",
      optimize: "התאם",
      listView: "תצוגת רשימה",
      mapView: "תצוגת מפה",
      noOrders: "אין הזמנות במסלול זה",
      addOrdersPrompt: "הוסף הזמנות כדי ליצור את מסלול המשלוח שלך",
      dragInstructions: "לחץ והחזק כדי לסדר מחדש",
      markAsCompleted: "סמן כהושלם",
      saveRoute: "שמור מסלול",
      removeOrder: "הסר הזמנה",
      callOptions: "אפשרויות שיחה",
      whatsapp: "וואטסאפ",
      regularCall: "שיחה רגילה",
      cancel: "ביטול",
      removeOrderConfirm: "האם אתה בטוח שברצונך להסיר הזמנה זו מהמסלול?",
      errorLoadingRoute: "שגיאה בטעינת פרטי מסלול",
      cannotModifyCompleted: "לא ניתן לערוך מסלול שהושלם",
      needMoreOrders: "נדרשות לפחות שתי הזמנות כדי להתאים מסלול",
      optimizationFailed: "התאמת המסלול נכשלה",
      routeOptimizedMessage: "המסלול שלך מותאם כעת לסדר המשלוח היעיל ביותר.",
      alreadyCompleted: "מסלול זה כבר הושלם",
      emptyRouteCompletion: "לא ניתן להשלים מסלול ריק",
      completeRoute: "השלם מסלול",
      completeRouteConfirm: "האם אתה בטוח שברצונך לסמן מסלול זה כהושלם? לא ניתן לבטל פעולה זו.",
      completionFailed: "השלמת המסלול נכשלה",
      routeCompleted: "המסלול סומן כהושלם בהצלחה",
      errorAddingOrders: "הוספת הזמנות למסלול נכשלה",
      errorRemovingOrder: "הסרת הזמנה מהמסלול נכשלה",
      saveFailed: "שמירת המסלול נכשלה",
      routeSaved: "המסלול נשמר בהצלחה",
      yourLocation: "מיקומך הנוכחי",
      noAvailableOrders: "אין הזמנות זמינות",
      checkOrders: "בדוק בדף ההזמנות למשלוחים זמינים",
      delivered: "נמסר",
      stop: "תחנה",
      map: "מפה",
      list: "רשימה",
      orderId: "מספר הזמנה",
      phone: "טלפון",
      call: "שיחה",
      changeStatus: "עדכן סטטוס",
      selectStatus: "בחר סטטוס",
      selectReason: "בחר סיבה",
      confirmStatusChange: "אשר שינוי סטטוס",
      confirmStatusChangeMessage: "האם אתה בטוח שברצונך לשנות את הסטטוס ל",
      reason: "סיבה",
      statusChangeNotAllowed: "לא ניתן לשנות את סטטוס ההזמנה הזו",
      errorUpdatingStatus: "עדכון הסטטוס נכשל",
      deleteRouteTitle: "מחק מסלול",
      deleteRouteConfirm: "האם אתה בטוח שברצונך למחוק מסלול זה? לא ניתן לבטל פעולה זו.",
      routeDeleted: "המסלול נמחק בהצלחה",
      error: "שגיאה",
      accessDeniedMessage: "פיצ'ר זה זמין רק לנהגים וחברות משלוחים.",
      routeNotFound: "המסלול לא נמצא",
      locationPermission: "הרשאת מיקום",
      locationNeeded: "נדרשת הרשאת מיקום לניווט.",
      dispatchTo: "שלח אל",
      message: "הודעה"
    },

    common:{
      delete:"מחק",
      cancel:"ביטול",
      confirm:"אשר",
      save:"שמור",
      close:"סגור",
      edit:"ערוך",
      view:"צפה",
      success:"בוצע בהצלחה",
      error:"שגיאה",
      search:"חפש",
      add:"הוסף",
      complete:"הושלם",
      selectOption:"בחר",
      assignOrders:"הקצה משלוחים",
      loadingOrders:"טוען...",
      retry:"נסה שוב",
      loading:"טוען...",
      loadingMore:"טוען עוד...",
      pending:"ממתין",
      gotIt:"סיום",
      skip:"דלג",
      next:"הבא",
      refresh:"הפעל מחדש",
      finish:"סיום",
      someUpdatesFailed:"Some updates failed",
      updateError:"Update error",
    },

    balance:{
      balanceHistory:"היסטוריית יתרות",
      "paymentType": "סוג תשלום",
      "transactionType": "עסקה",
      "otherType": "עדכון",
      "balanceAfter": "יתרה לאחר עסקה",
      "currentBalance": "יתרה נוכחית",
      "noTransactions": "לא נמצאו עסקאות",
      "loading": "טוען"
    },

    // (tabs)
    tabs: {
      index: {
        title: "בית",
        summaryTitle:"סיכום משלוחים",
        statusTitle:"סקירה כללית",
        boxes: {
          todayOrders: "הזמנות היום",
          moneyInBranches: "כסף בסניפים",
          readyMoney:"כסף מוכן לאיסוף",
          readyOrders:"משלוחים מוחזרים/מוחלפים מוכנים לאיסוף",
          moneyInBranch: "כסף בסניף",
          moneyWithDrivers: "כסף אצל נהגים",
          moneyWithDriver: "כסף אצלי",
          inWaiting: "בהמתנה",
          inBranch: "בסניף",
          onTheWay: "בדרך",
          delivered: "נמסר",
          returned: "הוחזר",
          returnedInBranch: "הוחזר בסניף",
          rescheduled: "נדחה",
          stuck: "תקוע",
          rejected: "נדחה",
          ofOrders: "מתוך משלוחים",
          withDriver: "אצל נהג"
        },
        balanceTitle:"היתרה שלך",
        balance:{
          available:"יתרה נוכחית",
        }
      },
      orders: {
        title: "משלוחים",
        emptyArray: "אין הזמנות להצגה",
        filters: {
          // filterByGroup
          all: "הכל",
          todayOrders: "הזמנות היום",
          waiting: "בהמתנה",
          rejected: "נדחה",
          inBranch: "בסניף",
          inProgress: "בתהליך",
          stuck: "תקוע",
          delayed: "איחור",
          onTheWay: "בדרך",
          driverResponsibilityOrders: "בעבודת נהג",
          rescheduled: "נדחה",
          replacedDeliveredOrders: "הוחזר",
          returnBeforeDeliveredInitiated: "החזרה לפני מסירה החלה",
          returnAfterDeliveredInitiated: "החזרה לאחר מסירה החלה",
          returned: "הוחזר",
          returnedInBranch: "הוחזר בסניף",
          returnedOut: "בתהליך החזרה/החלפה",
          businessReturnedDelivered: "החזרה/החלפה נמסרה למוכר",
          delivered: "נמסר",
          moneyInBranch: "כסף בסניף",
          moneyOut: "בתהליך מסירת כסף",
          businessPaid: "שולם",
          completed: "הושלם",
          received:"נאסף",
          "delivered/received":"נמסר/נאסף",
          dispatched_to_branch:"נשלח לסניף היעד",
          // searchByGroup
          orderId: "מספר משלוח",
          referenceID: "מספר מזהה",
          sender: "שולח",
          receiverName: "שם לקוח",
          receiverPhone: "טלפון לקוח",
          receiverCity: "עיר לקוח",
          receiverArea: "אזור לקוח",
          receiverAddress: "כתובת לקוח",
          driverName: "שם נהג",
          // searchByDateGroup
          today: "היום",
          yesterday: "אתמול",
          thisWeek: "השבוע",
          thisMonth: "החודש",
          thisYear: "השנה",
          selectDate: "בחר תאריך"
        },
        track: {
          orderTracking: "מעקב משלוח",
          order: "משלוח",
          package: "חבילה",
          quantity: "כמות",
          weight: "משקל",
          receivedItems: "פריטים שהתקבלו",
          receivedQuantity: "כמות שהתקבלה",
          deliveryStatus: "סטטוס מסירה",
          branch: "סניף",
          issue: "יש לך בעיה? הגש תלונה",
          openCase: "פתח תלונה",
          unknown: "לא ידוע",
          "loading": "טוען...",
          "errorTitle": "סליחה!",
          "orderNotFound": "ההזמנה לא נמצאה או שלא ניתן לטעון אותה",
          "goBack": "חזרה",
          "tryAgain": "נסה שוב",
          "receiverInfo": "פרטי נמען",
          "name": "שם",
          "mobile": "נייד",
          "secondMobile": "נייד נוסף",
          "location": "מיקום",
          "address": "כתובת",
          "senderInfo": "פרטי שולח",
          "orderDetails": "פרטי הזמנה",
          "orderType": "סוג הזמנה",
          "paymentType": "סוג תשלום",
          "referenceId": "מספר מזהה",
          "itemType": "סוג משלוח",
          "driver": "נהג",
          "financialDetails": "פרטים פיננסיים",
          "codValue": "ערך תשלום במסירה",
          "deliveryFee": "עמלת משלוח",
          "netValue": "נטו למוכר",
          "checks": "המחאות",
          "checkNumber": "מספר המחאה",
          "checkValue": "ערך המחאה",
          "checkDate": "תאריך המחאה",
          "notes": "הערות",
          "packageDetails": "פרטי חבילה",
          "package": "חבילה",
          "quantity": "כמות",
          "weight": "משקל",
          "receivedItems": "פריטים שהתקבלו",
          "receivedQuantity": "כמות שהתקבלה",
          "deliveryStatus": "סטטוס מסירה",
          "needHelp": "צריך עזרה",
          "openCase": "הגש תלונה"
        },
        "order": {
          "states": {
            "on_the_way_back": "הוחזר לתהליך משלוח",
            "pickedUp": "נאסף",
            "deliveredToDestinationBranch": "נמסר לסניף היעד",
            "rejected": "נדחה",
            "cancelled": "בוטל",
            "stuck": "תקוע",
            "rescheduled": "נדחה",
            "on_the_way": "בדרך",
            "dispatched_to_branch": "נשלח לסניף היעד",
            "return_before_delivered_initiated": "החזרה לפני מסירה",
            "referenceIdUpdated": "הפניה עודכנה בהצלחה",
            "referenceIdUpdateError": "הפניה לא עודכנה",
            "return_after_delivered_initiated": "החזרה לאחר מסירה",
            "return_after_delivered_fee_received": "החזרה לאחר מסירה וקבלת עמלת משלוח",
            "delayed": "איחור",
            "suspendReasons": {
              "closed": "סגור",
              "no_response": "אין תגובה",
              "cancelled_from_office": "בוטל מהמשרד",
              "address_changed": "כתובת השתנתה",
              "not_compatible": "לא תואם למפרט",
              "delivery_fee_issue": "לא רוצה לשלם עמלת משלוח",
              "duplicate_reschedule": "בקשה לדחייה כפולה",
              "receive_issue": "לא רוצה לקבל",
              "sender_cancelled": "בוטל על ידי השולח",
              "reschedule_request": "הנמען ביקש לדחות את הקבלה",
              "incorrect_number": "מספר לא נכון",
              "not_existing": "הנמען לא קיים בארץ",
              "cod_issue": "לא רוצה לשלם עבור המשלוח",
              "death_issue": "לנמען יש מקרה פטירה",
              "not_exist_in_address": "הנמען לא קיים בכתובת המסירה", 
              "receiver_cancelled": "בוטל על ידי הנמען",
              "receiver_no_response": "אין תגובה מהנמען",
              "order_incomplete": "המשלוח לא הושלם",
              "receive_request_issue": "הנמען לא ביקש את המשלוח",
              "other": "סיבה אחרת"
            },
            "delivered": "נמסר",
            "waiting": "בהמתנה",
            "inBranch": "בסניף",
            "inProgress": "בתהליך",
            "delivered": "נמסר",
            "received": "נאסף",
            "delivered_received": "נמסר / נאסף"
          },
          "enterReferenceId": "הזן את מספר ההפניה",
          "referenceIdRequired":"מספר ההפניה נדרש",
            "referenceIdHelper": "אתה יכול להזין אותו או לסרוק קוד QR/ברקוד",
            "referenceIdPlaceholder": "הזן או סרוק מספר ההפניה",
            "scan": "סרוק",
            "skip":"דלג",
            "save":"שמור",
            "referenceIdRequired":"מספר ההפניה נדרש",
          "editPhone": "ערוך",
          "receiverAddress": "כתובת נמען",
          "codValue": "ערך תשלום במסירה",
          "codUpdateReason": "סיבה לשינוי ערך תשלום במסירה",
          "enterReason": "הזן סיבה לשינוי",
          "codUpdateNote": "הערה: שינוי ערך תשלום במסירה דורש אישור מהשולח",
          "loading": "טוען...",
          "codValue": "ערך משלוח",
          "error": "שגיאה",
          "errorFetchingOrder": "שגיאה בטעינת פרטי הזמנה",
          "ok": "אישור",
          "phoneUpdateSuccess": "מספרי הטלפון עודכנו בהצלחה",
          "receiverDetailsUpdateSuccess": "פרטי הנמען עודכנו בהצלחה",
          "codUpdateRequestSuccess": "בקשת שינוי ערך תשלום במסירה נשלחה בהצלחה",
          "receiverPhones": "טלפוני נמען",
          "loading": "טוען...",
          "error": "שגיאה",
          "errorFetchingOrder": "שגיאה בטעינת פרטי הזמנה",
          "ok": "אישור",
          "missingStatus": "לא נבחר סטטוס",
          "selectReason": "בחר סיבה",
          "statusChangeSuccess": "הסטטוס עודכן בהצלחה",
          "statusChangeError": "עדכון הסטטוס נכשל",
          "selectBranch": "בחר סניף",
          "reason": "סיבה",
          "branch": "סניף",
          "orderType": "סוג משלוח",
          "unknown": "לא ידוע",
          "userSenderBoxLabel": "שולח",
          "userClientBoxLabel": "לקוח",
          "userDriverBoxLabel": "נהג",
          "userBoxPhoneContactLabel": "שיחה",
          "userBoxMessageContactLabel": "הודעה",
          "contactPhone": "טלפון",
          "contactWhatsapp": "וואטסאפ",
          "edit": "ערוך",
          "status":"סטטוס",
          "selectStatus":"בחר סטטוס",
          "confirmStatusChange":"האם אתה בטוח שברצונך לשנות את הסטטוס ל",
          "changeStatus": "שנה סטטוס",
          "changeStatusAlert": "אתה עומד לשנות את סטטוס המשלוח ל",
          "changeStatusAlertNote": "רשום הערה...",
          "changeStatusAlertConfirm": "אשר",
          "changeStatusAlertCancel": "ביטול",
          "print": "הדפס",
          "location": "מיקום",
          "to_branch":"נשלח לסניף",
          "to_driver":"נשלח לנהג",
          "financialDetails": "פרטים פיננסיים",
          "codValue": "ערך משלוח",
          "netValue": "נדרש למוכר",
          "deliveryFee": "עמלת משלוח",
          "checksAvailable": "המחאות זמינות",
          "note": "הערה",
          "add_currency": "הוסף מטבע אחר",
          "success": "הצלחה",
          "orderActions": "פעולות הזמנה",
          "receivedItems": "פריטים שהתקבלו",
          "receivedQuantity": "כמות שהתקבלה",
          "noteRequiredForOther": "נדרשת הערה כאשר בוחרים סיבה \"אחר\"",
          "statusChangeOffline": "הסטטוס יעודכן כאשר תהיה חיבור לאינטרנט",
          "orderChecks": {
            "addCheck": "הוסף המחאה",
            "title": "המחאות הזמנה",
            "orderId": "מספר הזמנה",
            "loading": "טוען...",
            "totalChecks": "סה\"כ המחאות",
            "totalValue": "ערך כולל",
            "check": "המחאה",
            "value": "ערך",
            "checkNumberPlaceholder": "הזן מספר המחאה",
            "number": "מספר",
            "currency": "מטבע",
            "date": "תאריך",
            "noChecks": "אין המחאות",
            "noChecksMessage": "אין המחאות המשויכות להזמנה זו.",
            "backToOrder": "חזרה",
            "checkDetails": "פרטי המחאה",
          }
        },
        validation: {
          required: "שדה זה נדרש"
        },
        save: "שמור שינויים",
        cancel: "ביטול",
        error: "שגיאה",
        success: "הצלחה",
        errorMsg: "אירעה שגיאה",
        errorValidationMsg: "אנא תקן את השגיאות בטופס",
        // (create)
        create: {
          edit: "ערוך משלוח",
          create: "צור הזמנה",
          submit: "שלח",
          loading: "טוען...",
          success:"הפעולה הצליחה",
          successMsg:"המשלוח נרשם בהצלחה",
          error: "שגיאה",
          errorValidationMsg: "אנא בדוק את השדות המסומנים כשגויים",
          errorMsg: "אירעה שגיאה בלתי צפויה, אנא פנה לסוכן התמיכה לעזרה",
          insufficientBalance:"יתרה לא מספקת",
          insufficientBalanceMsg:"היתרה שלך לא מספיקה להשלמת פעולה זו",
          "save": "שמור שינויים",
          "cancel": "ביטול",
          "phoneUpdateSuccess": "מספרי הטלפון עודכנו בהצלחה",
          "receiverDetailsUpdateSuccess": "פרטי הנמען עודכנו בהצלחה",
          sections: {
            referenceId:{
              title:"מספר מזהה (אופציונלי)",
              explain:"הכנס את קוד QR שלך אם קיים"
            },
            sender: {
              title: "שולח",
              fields: {
                "sender": "שולח",
                "with_money_receive": "עם קבלת כסף",
                "my_balance_deduct": "חיוב מהיתרה שלי",
                "sender_deduct": "חיוב מהיתרת השולח",
                "processing_return": "בתהליך החזרה",
                "please_wait": "يرجى الانتظار...",
                "return_success": "تم الإرجاع بنجاح",
                "balance_returned": "تم إعادة الرصيد بنجاح",
                "return_error": "خطأ في الإرجاع",
                "return_failed": "فشل في إرجاع الرصيد",
                "deduction_error": "خطأ في الخصم",
                "deduction_failed": "فشل في معالجة الخصم",
                "updating_deductions": "جاري تحديث الخصومات",
                "update_deduction_failed": "فشل في تحديث الخصومات",
                "deduction_success": "تم الخصم بنجاح",
                "deduction_processed": "تم تنفيذ الخصم بنجاح",
                "processing_deduction": "جاري معالجة الخصم",
                "select_deduction_method": "اختر طريقة الخصم",
                "choose_deduction_method": "اختر كيفية خصم الرصيد",
                "manual_deduction": "خصم يدوي",
                "auto_deduction": "خصم تلقائي",
                "checking_balance": "جاري التحقق من الرصيد",
                "select_deduction_currency": "اختر عملة الخصم",
                "choose_currency": "اختر العملة",
                "available": "متوفر",
                "needed": "مطلوب",
                "deduct_amount": "المبلغ المراد خصمه",
                "current_balance": "الرصيد الحالي",
                "new_balance": "الرصيد الجديد",
                "deduction_ready": "الخصم جاهز",
                "deduction_on_submit": "سيتم تطبيق الخصم عند الإرسال",
                "insufficient_balance_for": "الرصيد غير كافٍ لـ",
                "confirm_auto_deductions": "تأكيد الخصومات التلقائية",
                "system_will_deduct": "سيقوم النظام بخصم",
                "from_available_balances": "من الأرصدة المتوفرة",
                "deductions_ready": "الخصومات جاهزة",
                "deductions_on_submit": "سيتم تطبيق الخصومات عند الإرسال",
                "sender_required": "مطلوب إدخال المرسل",
                "cod_required": "مطلوب ادخال سعر الطرد",
                "no_cod_values": "لم يتم العثور على قيم الدفع عند الاستلام",
                "cancel": "إلغاء",
                "confirm": "تأكيد",
                "confirm_deduction": "تأكيد الخصم",
                "confirm_return": "تأكيد الإرجاع",
                "confirm_balance_return": "تأكيد إعادة الرصيد",
                "return_balance_confirmation": "هل تريد إعادة المبالغ المخصومة سابقًا إلى رصيد المرسل؟",
                "yes": "نعم",
                "no": "لا",
                "ok": "موافق",
                "currency_mismatch": "خطأ في تطابق العملة",
                "exceed_balance": "تجاوز حد الرصيد",
                "exceed_balance_desc": "السماح بتجاوز حد الرصيد",
                "balance_confirmation": "تأكيد الرصيد",
                "balance_change_confirmation": "سيؤثر هذا الإجراء على رصيد المرسل. هل ترغب في المتابعة؟",
                "return_balance": "إعادة الرصيد",
                "deduction_amounts": "المبالغ المطلوب خصمها",
                "balance_after": "الرصيد بعد",
                "auto_deduction_notice": "ملاحظة خصم تلقائي",
                "auto_deduction_message": "طرد احضار سوف يتم الخصم تلقائيا من رصيدك عند التأكيد, في حال لم يكن لديك رصيد كافي الرجاء التوجه الى أفرب فرع لدفع قيمة هذه العملية لدى موظف الاستقبال.",
                "auto_deduction_message_payment": "طرد دفع سوف يتم الخصم تلقائيا من رصيدك عند التأكيد, في حال لم يكن لديك رصيد كافي الرجاء التوجه الى أفرب فرع لدفع قيمة هذه العملية لدى موظف الاستقبال."
              }
            },
            client: {
              title: "الزبون",
              fields: {
                found:"נמצא אוטומטית",
                name:"الاسم",
                client: "الزبون",
                firstPhone: "رقم الهاتف",
                secondPhone: "رقم الهاتف الثاني",
                city: "المدينة",
                area: "المنطقة",
                address: "العنوان",
                searchReceiver:"ابحث عن الزبون",
                enterPhone:"ادخل رقم الهاتف",
                noReceivers:"لا يوجد زبائن",
                found:"נמצא",
                receivers:"زبائن",
                search_error:"يجب ادخال رقم هاتف صالح",
                no_results:"لا يوجد زبائن",
                enter_more:"ادخل 3 ارقام على الأقل للبحث",
                add_new:"اضافة زبون جديد",
                enter_valid_phone:"ادخل رقم هاتف صالح",
                add_new_receiver:"اضافة زبون جديد",
                unnamed:"غير معروف",
                search_receiver:"أدخل هاتف الزبون",
                search_placeholder:"ادخل رقم الهاتف"
              }
            },
            cost: {
              title: "עלות",
              fields: {
                "netValue": "ערך נטו",
                "checks":"המחאות",
                "packageCost": "מחיר משלוח ללא משלוח",
                "totalPackageCost": "מחיר משלוח כולל משלוח",
                "amount": "סכום",
                "deliveryFee": "עמלת משלוח",
                "isReplaced": "הוחלף",
                "insufficient_balance": "יתרה לא מספקת",
                "balance": "יתרה נוכחית",
                "insufficient_balance_alert": "לא מספיק להשלמת פעולה זו",
                "missing_fields": "שדות חסרים",
                "fields_required": "יש להזין פרטי נמען או עמלת משלוח או ערך תשלום במסירה"
              }
            },
            details: {
              title: "פרטי משלוח",
              paymentDetailsTitle:"פרטי תשלום",
              fields: {
                description:"תיאור",
                product: "מוצר",
                quantity: "מספר פריטים",
                weight: "משקל",
                orderType: "סוג משלוח"
              }
            },
            orderTypes: {
              title: "סוג משלוח",
              titlePlaceholder:"בחר סוג משלוח",
              delivery: "משלוח",
              receive: "איסוף",
              "delivery/receive": "משלוח / החלפה",
              payment: "תשלום",
              receivedItems: "פריטים שהתקבלו",
              receivedQuantity: "כמות שהתקבלה"
            },
            currencyList: {
              title: "מטבע",
              ILS: "שקל",
              USD: "דולר",
              JOD: "דינר"
            },
            itemsContentTypeList:{
              "normal": "רגיל",
              "large": "גדול",
              "extra_large": "גדול מאוד",
              "fragile": "שביר",
              "high_value": "ערך גבוה"
            },
            paymentType: {
              title: "סוג תשלום",
              cash: "מזומן",
              check: "המחאה",
              "cash/check": "מזומן/המחאה"
            },
            itemsCotnentType: {
              title: "סוג תוכן פריטים",
              normal: "רגיל"
            },
            notes: {
              title: "הערות",
              note: "הערה"
            },
            checks:{
              add:"הוסף המחאה",
              check:"המחאה",
              number:"מספר",
              value:"סכום",
              currency:"מטבע",
              date:"תאריך"
            }
          },
            "validation": {
            "required": "שדה זה נדרש"
          }
        }
      },
      collections: {
        title: "גבייה",
        close:"סגור",
        options: {
          "driver_money_collections": "גביית כספים מנהגים",
          "business_money_collections": "גביית כספים מעסקים",
          "driver_returned_collections": "גביית החזרות/קבלות מנהגים",
          "business_returned_collections": "גביית החזרות/קבלות מעסקים",
          "runsheet_collections": "גביית משלוחים בתהליך",
          "sent_collections": "גבייה שנשלחה עם נהגים",
          "my_money_collections":"גביית הכספים שלי",
          "my_returned_collections":"גביית החזרות/קבלות שלי",
          "driver_own_collections":"גביית הכספים שלי מעסקים",
          "driver_own_sent_collections":"גבייה שנשלחה לעסקים"
        }
      },
      settings: {
        title: "הגדרות",
        options: {
          users: "משתמשים",
          language: {
            title: "שפה",
            options: {
              ar: "ערבית",
              en: "אנגלית",
              he: "עברית"
            }
          },
          theme:{
            title:"עיצוב",
            options:{
              light:"בהיר",
              dark:"כהה",
              system:"אוטומטי"
            }
          },
          complaints: "תלונות",
          changePassword: "שנה סיסמה",
          changePasswordFields: {
            currentPasswordRequired: "נדרשת סיסמה נוכחית",
            newPasswordRequired: "נדרשת סיסמה חדשה",
            passwordValidationRequired: "הסיסמה חייבת להכיל לפחות 8 תווים",
            confirmPasswordRequired: "אנא אשר סיסמה",
            passwordMatchValidation: "הסיסמאות לא תואמות",
            success: "הצלחה",
            successMsg: "הסיסמה שונתה בהצלחה",
            changePass: "שנה סיסמה",
            tips: "טיפים לאבטחה",
            usage: "השתמש ב-8 תווים לפחות",
            letterInclusion: "כלול אותיות גדולות",
            numbersInclusion: "כלול מספרים וסמלים",
            currentPass: "סיסמה נוכחית",
            currentPassHint: "הזן את הסיסמה הנוכחית",
            newPass: "סיסמה חדשה",
            newPassHint: "הזן סיסמה חדשה",
            confirmPassword: "אשר סיסמה",
            weak: "חלשה",
            medium: "בינונית",
            strong: "חזקה",
            veryStrong: "חזקה מאוד",
            updating: "מעדכן..."
          },          
          contactUs: "צור קשר",
          aboutUs: "אודות",
          locations: "מיקומים",
          logout: "התנתק",
          deleteAccount: "מחק חשבון",
          deleteAccountHint: "האם אתה בטוח שברצונך למחוק את החשבון?",
          driverStats: "סטטיסטיקות נהג",
          switchAccount:"החלף חשבון",
          otherAccounts:"חשבונות נוספים",
          addNewAccount:"הוסף חשבון חדש",
          currentAccount:"חשבון נוכחי",
          active:"פעיל",
          addNewAccount: "הוסף חשבון חדש",
          addAccount:"הוסף חשבון",
          addAccount:"إضافة حساب",
          accountSwitched:"החשבון הוחלף",
          accountSwitchedMessage:"החלפת החשבון בוצעה בהצלחה",
          accountAlreadyExists:"החשבון כבר קיים",
          accountAdded:"חשבון נוסף",
          accountAddedMessage:"החשבון נוסף בהצלחה",
          removeAccount:"מחק חשבון",
          removeAccountMessage:"האם אתה בטוח שברצונך למחוק חשבון זה? תוכל להוסיף אותו שוב מאוחר יותר.",
          cancel:"ביטול",
          remove:"מחק",
          driverStats: "إحصائيات السائق"
        }
      }
    },

    // (collection)
    collections: {
      title: "גבייה",
      emptyArray: "אין גבייה להצגה",
      filters: {
        // filterByGroup
        all: "הכל",
        returnedInBranch: "הוחזר בסניף",
        deleted: "נמחק",
        returnedOut: "הוחזר חיצוני",
        returnedDelivered: "החזרה נמסרה",
        completed: "הושלם",
        moneyInBranch: "כסף בסניף",
        moneyOut: "כסף בחוץ",
        paid: "שולם",
        pending: "ממתין",
        inDispatchedToBranch: "בתהליך משלוח לסניף",
        partial: "חלקי",
        returnedDelivered: "החזרה נמסרה",
        // searchByGroup
        collectionId: "מספר גבייה",
        sender: "שולח",
        driver: "נהג",
        prevDriver: "נהג קודם",
        currentBranch: "סניף נוכחי",
        // searchByDateGroup
        today: "היום",
        yesterday: "אתמול",
        thisWeek: "השבוע",
        thisMonth: "החודש",
        thisYear: "השנה",
        selectDate: "בחר תאריך"
      },
      collection: {
        numberOfOrders: "מספר משלוחים",
        numberOfCollections: "מספר גבייה",
        moneyToDeliver: "כסף למסירה",
        moneyToCollect: "סה\"כ גביית כספים",
        checksToDeliver: "המחאות למסירה",
        currentBranch: "סניף נוכחי",
        toBranch: "סניף יעד",
        print: "הדפס",
        collections: "גבייה",
        orders: "משלוחים",
        actions: "בחר פעולה",
        businessName: "שם העסק",
        scanToConfirm: "מזהה גבייה",
        businessPhone: "טלפון העסק",
        businessLocation: "מיקום העסק",
        totalDeductions: "סה\"כ חיסכונות",
        finalAmount: "סה\"כ משלוחים",
        "request_money": "בקש את הכסף שלך",
        "prepare_money": "הכן את הכסף שלי",
        "send_money": "שלח כסף אל",
        "request_package": "בקש את המשלוחים שלך",
        "prepare_package": "הכן את המשלוחים שלי",
        "send_package": "שלח משלוחים אל",
        "confirmPaymentMessage": "על ידי השלמת פעולה זו, אתה מאשר שקיבלת את הסכום, והחברה אינה אחראית עוד לכל תלונה עתידית",
        "cancel": "ביטול",
        "confirm": "אשר",
        "confirmReturnedMessage": "על ידי ביצוע זה, אתה מאשר שקיבלת את המשלוח, והחברה אינה אחראית עוד לכל תלונה עתידית לגבי קבלתו.",
        confirmTitle:"אשר קבלה",
        pendingConfirmations:"אישורים ממתינים",
        moneyCollections:"גביית כספים",
        packageCollections:"גביית משלוחים",
        noCollectionsToConfirm:"אין גבייה לאישור",
        collectionId:"מספר גבייה",
        orderIds:"מספרי משלוחים",
        totalNetValue:"ערך נטו כולל",
        confirmPayment:"אשר תשלום",
        confirmDelivery:"אשר מסירה",
        partialSuccess:"הצלחה חלקית",
        updatedCollections:"גבייה עודכנה",
        success:"הצלחה",
        statusUpdated:"הסטטוס עודכן",
        failedCollections:"גבייה שלא עודכנה בהצלחה",
        error:"שגיאה",
        tryAgainLater:"אנא נסה שוב מאוחר יותר",
        deliveryType:"סוג משלוח",
        orderCount:"מספר משלוחים",
        whatsappOptions:"אפשרויות וואטסאפ",
        sentMoney:"כספים שנשלחו לטרנספורטים",
        sentPackages:"גבייה שנשלחה לטרנספורטים"
      }
    },

    // (users)
    users: {
      title: "משתמשים",
      emptyArray: "אין משתמשים להצגה",
      filters: {
        // filterByGroup
        all: "הכל",
        active: "פעיל",
        inactive: "לא פעיל",
        // searchByGroup
        userId: "מספר משתמש",
        name: "שם",
        commercial: "שם מסחרי",
        email: "אימייל",
        phone: "טלפון",
        branch: "סניף",
        role: "תפקיד",
        city: "עיר",
        area: "אזור",
        address: "כתובת",
        // searchByDateGroup
        today: "היום",
        yesterday: "אתמול",
        thisWeek: "השבוע",
        thisMonth: "החודש",
        thisYear: "השנה",
        selectDate: "בחר תאריך"
      },
      user: {
        name: "שם",
        role: "תפקיד",
        edit: "ערוך",
        location:"מיקום"
      },
      // (create_user)
      create: {
        edit: "ערוך משתמש",
        create: "צור משתמש",
        submit: "שלח",
        loading: "טוען...",
        error: "שגיאה",
        errorValidationMsg: "אנא בדוק את השדות המסומנים",
        errorMsg: "אירעה שגיאה בלתי צפויה, אנא פנה לסוכן התמיכה לעזרה",
        success:"הפעולה הצליחה",
        successMsg:"הפעולה בוצעה בהצלחה",
        sections: {
          user: {
            title: "משתמש",
            fields: {
              name: "שם",
              commercial: "שם מסחרי",
              firstPhone: "מספר טלפון",
              secondPhone: "מספר טלפון שני",
              affillator: "חתימה",
              city: "עיר",
              area: "אזור",
              address: "כתובת"
            }
          },
          details: {
            title: "פרטים",
            fields: {
              role: "תפקיד",
              pricelist: "רשימת מחירים",
              branch:"סניף",
              manager:"מנהל חשבון"
            }
          }
        }
      }
    },

    complaints: {
      title: "תלונות",
      complaint: "תלונה",
      complaintId: "מספר תלונה",
      createdBy: "נוצר על ידי",
      supportAgent: "סוכן תמיכה",
      submit_complaint: "הגש תלונה",
      openComplaint: "פתח תלונה להזמנה",
      subject: "נושא",
      description: "תיאור",
      describe: "תאר את תלונתך...",
      submit: "שלח",
      success: "הצלחה",
      error: "שגיאה",
      employeeName: "שם עובד",
      successMsg: "התלונה הוגשה בהצלחה.",
      errorMsg: "הגשת התלונה נכשלה.",
      errorFailed: "אירעה שגיאה.",
      errorValidationMsg: "אנא מלא את כל השדות",
      orderId: "מספר משלוח",
      resolved: "נפתר",
      createdAt: "נוצר ב",
      messagePlaceholder: "כתוב הודעה...",
      notFound: "התלונה לא נמצאה",
      // searchByDateGroup
      today: "היום",
      yesterday: "אתמול",
      thisWeek: "השבוע",
      thisMonth: "החודש",
      thisYear: "השנה",
      selectDate: "בחר תאריך",
      status: {
        title: "סטטוס",
        all: "הכל",
        open: "בטיפול",
        closed: "סגור"
      },
      ok:"אישור",
      order:"משלוח",
      subjectPlaceholder:"הזן כותרת תלונה",
      describePlaceholder:"הזן תיאור הבעיה",
      "noComplaints": "אין תלונות",
      "noComplaintsDesc": "אין תלונות התואמות את המסננים שלך.",
      "newComplaint": "תלונה חדשה",
      "actions": "פעולות",
      "markAsResolved": "סמן כפתור",
      "respond": "הגב לתלונה",
      "viewDetails": "צפה בפרטים",
      "loading": "טוען...",
      "notFoundTitle": "לא נמצא",
      "goBack": "חזרה",
      "issue": "בעיה",
      "conversation": "שיחה",
      "noMessages": "אין הודעות עדיין",
      "startConversation": "התחל שיחה על ידי שליחת הודעה",
      "you": "אתה",
      "supportAgent": "סוכן תמיכה"
    },

    // Notifications
    notifications:{
      title:"הודעות",
      deleteAll:"מחק הכל",
      noNotifications:"אין הודעות",
      order:"הזמנה",
      noNotificationsTitle:"אין הודעות",
      loading:"טוען...",
      newNotification:"הודעה חדשה",
      newNotificationMessage:"יש לך הודעה חדשה",
      deleteAllConfirm:"האם אתה בטוח שברצונך למחוק את כל ההודעות?",
      confirmation:{
        processing:"מעבד...",
        pleaseWait:"אנא המתן...",
        success:"הצלחה",
        error:"שגיאה",
        confirm:"אשר",
        ok:"אישור",
        errorFailed:"אירעה שגיאה",
        errorValidationMsg:"אנא מלא את כל השדות",
        cancelled:"ביטול",
        cancelledMessage:"הבקשה בוטלה",
        successMessage:"האישור עובד בהצלחה",
        transactionId:"מספר עסקה",
        title:"נדרש אישור",
        message:"האם ברצונך לאשר פעולה זו?",
        confirm:"אשר",
        cancel:"ביטול",
        cod_update:{
          title:"אשר עדכון ערך משלוח",
          message:"האם ברצונך לאשר שינוי ערך משלוח?",
          approve:"אשר",
          reject:"דחה",
          successMessage:"ערך המשלוח עודכן בהצלחה"
        },
        money_in:{
          title:"אשר עסקת תשלום",
          message:"האם ברצונך לאשר עסקת תשלום?",
          confirm:"אשר",
          cancel:"ביטול",
          successMessage:"העסקה אושרה בהצלחה",
          amount:"סכום",
          currency:"מטבע",
          recipient:"נמען"
        },
        money_out:{
          title:"אשר עסקת משיכה",
          message:"האם ברצונך לאשר עסקת משיכה?",
          confirm:"אשר",
          cancel:"ביטול",
          successMessage:"העסקה אושרה בהצלחה",
          amount:"סכום",
          currency:"מטבע",
          recipient:"נמען"
        }
      }
    },

    // Search
    search: {
      placeholder: "חיפוש",
      by: "לפי",
      searchBy: "חיפוש לפי",
      searchByDate: "חיפוש לפי תאריך",
      cancel: "ביטול",
      confirm: "אשר",
      all: "הכל",
      selectFilter: "בחר מסנן",
      results: "תוצאות"
    },

    // pickerModal
    picker: {
      choose: "בחר",
      cancel: "ביטול",
      searchPlaceholder: "חיפוש",
      clear: "מחק"
    },

    // (camera)
    camera: {
      permission: {
        grant:"הרשאת מצלמה",
        notGranted: "הרשאת מצלמה לא ניתנה",
        request: "מבקש הרשאת מצלמה..."
      },
      scanText: "הצב ברקוד בתוך המסגרת",
      scanDuplicateTextError: "הפריט נסרק בעבר",
      scanInvalidTextError: "פורמט סריקה לא תקין",
      scanAgainTapText: "הקש לסרוק שוב",
      note: "השאר הערה...",
      fromBranch: "מהסניף",
      toBranch: "לסניף",
      branch:"סניף",
      confirm: "אשר",
      cancel: "ביטול",
      totalScanned: "סה\"כ נסרק",
      enterOrderId:"הזן מספר סידורי של משלוח",
      add:"הוסף",
      toDriver:"לנהג",
      scanOrEnterOrderId:"סרוק ברקוד או הזן מספר סידורי של משלוח",
      selectDriverFrom: "בחר נהג",
      selectDriver: "בחר נהג",
      driverSelectionRequired: "יש לבחור נהג"
    },

    // (change_password)
    chnagePassword: {
      title: "שנה סיסמה",
      currentPass: "סיסמה נוכחית",
      currentPassHint: "הזן את הסיסמה الحالية المستخدمة لتسجيل الدخول",
      newPass: "סיסמה חדשה",
      changePass: "שנה סיסמה"
    },

    // (contact_us)
    contact: {
      title: "צור קשר",
      open: "פתוח",
      closed: "סגור",
      weAre: "המשרדים שלנו",
      now: "עכשיו",
      local: "מקומי",
      facebook: "פייסבוק",
      tiktok: "טיקטוק",
      instagram: "אינסטגרם",
      whatsapp: "וואטסאפ",
      visitSite: "בקר באתר שלנו",
      openingHours:"שעות פעילות: 9:00 - 22:00",
      closingHours:"נחזור מחר ב-9:00",
      connectWithUs:"צור איתנו קשר"
    },

    // (about_us)
    about: {
      title: "אודות",
      aboutLabel: "אודות טיאר",
      aboutDesc: "בטיאר, אנו מתמחים במתן שירותי משלוח באיכות גבוהה ברחבי הגדה המערבית, ירושלים ואזורי 48. המשימה שלנו היא לספק פתרונות משלוח מהירים, אמינים ובטוחים המותאמים לצרכיך. בין אם מדובר במשלוחים עסקיים או משלוחים אישיים, אנו מבטיחים שכל חבילה תגיע ליעדה בבטחה ובזמן. עם המחויבות שלנו למצוינות ולשביעות רצון הלקוחות, טיאר היא השותף האמין שלך לחוויה לוגיסטית חלקה. נסה משלוח ללא דאגות עם צוות שנותן עדיפות ליעילות ולטיפול."
    },

    // (locations)
    locations: {
      title: "מיקומים",
      tulkarm: {
        title: "טול כרם",
        desc: "המרכז הראשי"
      },
      hebron: {
        title: "חברון",
        desc: "מרכז משלוחים בחברון"
      },
      ramallah: {
        title: "רמאללה",
        desc: "מרכז משלוחים ברמאללה"
      },
      jenin: {
        title: "ג'נין",
        desc: "מרכז משלוחים בג'נין"
      }
    },

    // greeting
    greeting: {
      morning: "בוקר טוב! ☀️",
      afternoon: "צהריים טובים! 🌤️",
      evening: "ערב טוב! 🌙"
    },

    // track
    track: {
      title: "עקוב משלוח",
      desc: "הזן מספר משלוח כדי להתחיל מעקב",
      placeholder: "לדוגמה: 12321411"
    },

    roles: {
      admin: "מנהל",
      business: "עסק",
      manager: "אדמיניסטרטיבי",
      driver: "נהג",
      accountant: "רואה חשבון",
      entery: "מזין נתונים",
      warehouse_admin: "מנהל מחסן",
      warehouse_staff: "עובד מחסן",
      delivery_company: "חברת משלוחים",
      support_agent: "סוכן תמיכה",
      sales_representative: "נציג מכירות"
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("ar");
  const [loading, setLoading] = useState(true);

  // Function to safely restart the app
  const restartApp = () => {
    try {
      // For development environment
      if (__DEV__ && DevSettings) {
        DevSettings.reload();
        return;
      }
      
      // For production with RNRestart available
      if (RNRestart) {
        RNRestart.Restart();
        return;
      }
      
      // Fallback for when both methods above fail
      Alert.alert(
        "Restart Required",
        "Please close and reopen the app for the language change to take full effect.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Failed to restart the app:', error);
      Alert.alert(
        "Restart Required",
        "Please close and reopen the app for the language change to take full effect.",
        [{ text: "OK" }]
      );
    }
  };

  // Enhanced language setter with app restart
  const setLanguage = async (newLanguage) => {
    try {
      if (newLanguage === language) {
        return; // No change, no need to restart
      }
      
      // Save the new language preference
      await saveToken('language', newLanguage);
      
      // Configure RTL if needed
      const isNewLangRTL = newLanguage === 'ar' || newLanguage === 'he';
      if (isNewLangRTL !== I18nManager.isRTL) {
        I18nManager.allowRTL(isNewLangRTL);
        I18nManager.forceRTL(isNewLangRTL);
      }
      
      // Update state
      setLanguageState(newLanguage);
      
      // Always restart after language change
      setTimeout(() => {
        restartApp();
      }, 100);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get saved language
        const savedLanguage = await getToken('language') || 'ar';
        
        // Configure RTL based on language
        const shouldBeRTL = savedLanguage === 'ar' || savedLanguage === 'he';
        
        // Only change RTL if it doesn't match what it should be
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
        }
        
        setLanguageState(savedLanguage);
      } catch (error) {
        // Don't force RTL as fallback - respect system settings
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const getTranslation = (path, defaultValue = '') => {
    if (!language || !translations[language]) return defaultValue;
    return path.split('.').reduce((obj, key) => (obj ? obj[key] : null), translations[language]) 
           ?? defaultValue;
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4361EE" style={{ flex: 1 }} />;
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      getTranslation,
      isRTL: language === 'ar' || language === 'he'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}