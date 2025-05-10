import { createContext, useContext, useState,useEffect } from 'react';
import {ActivityIndicator} from "react-native";
import { getToken, saveToken } from './secureStore';

const LanguageContext = createContext();

export const translations = {
  en: {
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
      success:"Success"
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
          rescheduled:"Rescheduled",
          stuck:"Stuck",
          rejected:"Rejected",
          ofOrders:"of Orders"
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
          waiting:"Waiting",
          rejected:"Rejected",
          inBranch:"In Branch",
          inProgress:"In Progress",
          stuck:"Stuck",
          delayed:"Delayed",
          onTheWay:"On The Way",
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
            "pickedUp": "Picked Up",
            "deliveredToDestinationBranch": "Delivered to Destination Branch",
            "rescheduleReasons": {
              "title": "Reschedule",
              "receiverRequest": "Receiver Requested",
              "receiverUnavailable": "Receiver Unavailable",
              "incorrectTiming": "Incorrect Timing",
              "businessRequest": "Business Requested",
              "deliveryOverload": "Delivery Overload"
            },
            "return_before_delivered_initiated": {
              "title": "Return Initiated Before Delivery",
              "businessCancellation": "Cancelled by Business",
              "receiverCancellation": "Cancelled by Receiver",
              "addressRrror": "Incorrect Address",
              "noResponse": "No Response"
            },
            "return_after_delivered_initiated": {
              "title": "Return Initiated After Delivery",
              "businessCancellation": "Cancelled by Business",
              "receiverCancellation": "Cancelled by Receiver",
              "paymentFailure": "Payment Failure",
              "addressError": "Incorrect Address",
              "noResponse": "No Response",
              "packageIssue": "Issue with Package"
            },
            "returned": {
              "title": "Returned",
              "businessCancellation": "Cancelled by Business",
              "receiverCancellation": "Cancelled by Receiver",
              "paymentFailure": "Payment Failure",
              "addressError": "Incorrect Address",
              "noResponse": "No Response",
              "packageIssue": "Issue with Package"
            },
            "delivered": "Delivered",
            "waiting": "Waiting",
            "inBranch": "In Branch",
            "inProgress": "In Progress",
            "rejected": {
              "title": "Rejected",
              "rejectionReasons": {
                "businessCancellation": "Cancelled by Business",
                "invalidOrder": "Invalid Order"
              }
            },
            "stuck": {
              "title": "Stuck",
              "stuckReasons": {
                "paymentIssue": "Payment Issue",
                "incorrectAddress": "Incorrect Address"
              }
            },
            "delayed": {
              "title": "Delayed",
              "delayReasons": {
                "sortingDelay": "Sorting Delay",
                "highOrderVolume": "High Order Volume",
                "technicalIssue": "Technical Issue"
              }
            },
            "delivered":"Delivered",
            "received":"Received",
            "delivered_received":"Delivered / Received"
          },
          "editPhone": "Edit Receiver Phone",
          "receiverPhones": "Receiver Phones",
          "loading": "Loading...",
          "error": "Error",
          "errorFetchingOrder": "Error fetching order data",
          "ok": "OK",
          "missingStatus": "Missing status value",
          "selectReason": "Select Reason",
          "statusChangeSuccess": "Status updated successfully",
          "statusChangeError": "Failed to update status",
          "selectBranch": "Select Branch",
          "reason": "Reason",
          "branch": "Branch",
          "orderType": "Order Type",
          "unknown": "Unknown",
          "userSenderBoxLabel": "Sender",
          "userClientBoxLabel": "Client",
          "userDriverBoxLabel": "Driver",
          "userBoxPhoneContactLabel": "Call",
          "userBoxMessageContactLabel": "Message",
          "contactPhone": "Phone",
          "contactWhatsapp": "WhatsApp",
          "edit": "Edit",
          "changeStatus": "Change Status",
          "changeStatusAlert": "You are about to change this order's status to",
          "changeStatusAlertNote": "Leave a note...",
          "changeStatusAlertConfirm": "Confirm",
          "changeStatusAlertCancel": "Cancel",
          "print": "Print",
          "location": "Location",
          "financialDetails": "Financial Details",
          "codValue": "Parcel Cost",
          "netValue": "Amount Due to Merchant",
          "deliveryFee": "Delivery Fee",
          "checksAvailable": "Available Checks",
          "note": "Note",
          "add_currency": "Add Another Currency",
          "orderActions": "Order Actions",
          "to_branch":"To Branch",
          "orderChecks": {
            "title": "Order Checks",
            "orderId": "Order ID",
            "loading": "Loading...",
            "totalChecks": "Total Checks",
            "totalValue": "Total Value",
            "check": "Check",
            "value": "Value",
            "currency": "Currency",
            "date": "Date",
            "noChecks": "No Checks Found",
            "noChecksMessage": "There are no checks associated with this order.",
            "backToOrder": "Back",
            "checkDetails": "Check Details"
          }
        },
        // (create)
        create:{
          edit:"Edit Order",
          create:"Create Order",
          submit:"Submit",
          loading:"Loading...",
          success:"Success",
          successMsg:"Your order have been completed successfully",
          error:"Error",
          errorValidationMsg:"Please check the highlighted fields",
          errorMsg:"An unexpected error occurred, Please call the support agent to help",
          sections:{
            referenceId:{
              title:"Reference ID (optional)",
              explain:"Enter your QR code if available"
            },
            sender:{
              title:"Sender",
              fields:{
                sender:"Sender",
                my_balance_deduct:"Deduct from my balance",
                sender_deduct:"Deduct from sender balance"
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
                address:"Address"
              }
            },
            cost:{
              title:"Cost",
              fields:{
                packageCost:"Package Cost",
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
              fields:{
                product:"Product",
                quantity:"Quantity",
                weight:"Weight",
                orderType:"Order Type"
              }
            },
            orderTypes:{
              title:"Order Type",
              delivery:"Delivery",
              receive:"Receive",
              "delivery/receive":"Delivery / Recieve",
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
              "required": "This field is required"
            },
            "save": "Save Changes",
            "cancel": "Cancel",
            "success": "Success",
            "phoneUpdateSuccess": "Phone numbers updated successfully",
            "error": "Error",
            "errorMsg": "An error occurred",
            "errorValidationMsg": "Please correct the errors in the form",
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
          account:"Account"
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
        orders:"Orders",
        request_money:"Request your Money",
        prepare_money:"Prepare my Money",
        send_money:"Send the money to me",
        request_package:"Request your Package",
        prepare_package:"Prepare my Package",
        send_package:"Send the package to me",
        confirmPaymentMessage:"By making this process, you are confirming that you received the money, and the company is no longer holding any responsibility about later complaints",
        cancel:"Cancel",
        confirm:"Confirm",
        confirmReturnedMessage:"By doing this, you confirm that you have received the package, and that the company no longer bears any responsibility for subsequent complaints regarding its receipt."
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
        edit:"Edit"
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
        successMsg:"User have been created Successfully",
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
      order:"Order"
    },

    // Search
    search:{
      placeholder:"Search",
      by:"By",
      searchBy:"Search By",
      searchByDate:"Search By Date",
      cancel:"Cancel",
      confirm:"Confirm"
    },

    // pickerModal
    picker:{
      choose:"Choose a",
      cancel:"Cancel",
      searchPlaceholder:"Search"
    },

    // (camera)
    camera:{
      permission:{
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
      confirm:"Confirm",
      cancel:"Cancel",
      totalScanned:"Total Scanned",
      enterOrderId:"Ebter order ID",
      add:"Add",
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
      messenger:"Messenger",
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
      title:"Track Your Package",
      desc:"Enter Order Number to Start Tracking",
      placeholder:"for ex:12321411",
    }
  },
  ar: {
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
      passwordPlaceholder: "أنشئ كلمة مرور",
      confirmPasswordPlaceholder: "أكد كلمة المرور",
      comercialNamePlaceholder: "أدخل اسم نشاطك التجاري",
      businessActivity: "نوع النشاط التجاري",
      businessActivityPlaceholder: "ماذا تبيع / تقدم؟ (اختياري)",
      cityPlaceHolder: "اختر مدينتك",
      areaPlaceholder: "أدخل منطقتك",
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
      success:"تم بنجاح"
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
          moneyInBranches: "النقود في الفروع",
          readyMoney:"المال الجاهز للاستلام",
          readyOrders:"الطرود المرتجع/المستبدل الجاهزة للاستلام",
          moneyInBranch: "النقود في الفرع",
          moneyWithDrivers: "النقود مع السائقين",
          moneyWithDriver: "النقود التي بحوزتي",
          inWaiting: "في الانتظار",
          inBranch: "في الفرع",
          onTheWay: "في الطريق",
          delivered: "تم التوصيل",
          returned: "مرتجع",
          rescheduled: "معاد جدولته",
          stuck: "عالق",
          rejected: "مرفوض",
          ofOrders: "من الطرود"
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
          waiting: "في الانتظار",
          rejected: "مرفوض",
          inBranch: "في الفرع",
          inProgress: "قيد التنفيذ",
          stuck: "عالق",
          delayed: "متأخر",
          onTheWay: "في الطريق",
          rescheduled: "معاد جدولته",
          returnBeforeDeliveredInitiated: "بدء الإرجاع قبل التسليم",
          returnAfterDeliveredInitiated: "بدء الإرجاع بعد التسليم",
          returned: "مرتجع",
          returnedInBranch: "مرتجع في الفرع",
          returnedOut: "مرتجع خارجي",
          businessReturnedDelivered: "مرتجع تم تسليمه للتاجر",
          delivered: "تم التوصيل",
          moneyInBranch: "النقود في الفرع",
          moneyOut: "النقود خارجة",
          businessPaid: "تم الدفع للأعمال",
          completed: "مكتمل",
          received:"تم الاستلام",
          "delivered/received":"تم التوصيل والاستلام",
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
          "openCase": "فتح بلاغ"
        },
        "order": {
          "states": {
            "pickedUp": "تم الاستلام",
            "deliveredToDestinationBranch": "تم التوصيل إلى الفرع الوجهة",
            "rescheduleReasons": {
              "title": "مؤجل",
              "receiverRequest": "بطلب من المستلم",
              "receiverUnavailable": "المستلم غير متاح",
              "incorrectTiming": "توقيت غير مناسب",
              "businessRequest": "بطلب من التاجر",
              "deliveryOverload": "زيادة عدد الطلبات"
            },
            "return_before_delivered_initiated": {
              "title": "إرجاع قبل التوصيل",
              "businessCancellation": "إلغاء من التاجر",
              "receiverCancellation": "إلغاء من المستلم",
              "addressRrror": "خطأ في العنوان",
              "noResponse": "لا يوجد رد"
            },
            "return_after_delivered_initiated": {
              "title": "إرجاع بعد التوصيل",
              "businessCancellation": "إلغاء من التاجر",
              "receiverCancellation": "إلغاء من المستلم",
              "paymentFailure": "فشل في الدفع",
              "addressError": "خطأ في العنوان",
              "noResponse": "لا يوجد رد",
              "packageIssue": "مشكلة في الطرد"
            },
            "returned": {
              "title": "تم الإرجاع",
              "businessCancellation": "إلغاء من التاجر",
              "receiverCancellation": "إلغاء من المستلم",
              "paymentFailure": "فشل في الدفع",
              "addressError": "خطأ في العنوان",
              "noResponse": "لا يوجد رد",
              "packageIssue": "مشكلة في الطرد"
            },
            "delivered": "تم التوصيل",
            "waiting": "في الانتظار",
            "inBranch": "في الفرع",
            "inProgress": "قيد التنفيذ",
            "rejected": {
              "title": "مرفوض",
              "rejectionReasons": {
                "businessCancellation": "إلغاء من التاجر",
                "invalidOrder": "طلب غير صالح"
              }
            },
            "stuck": {
              "title": "متوقف",
              "stuckReasons": {
                "paymentIssue": "مشكلة في الدفع",
                "incorrectAddress": "عنوان غير صحيح"
              }
            },
            "delayed": {
              "title": "تأخير",
              "delayReasons": {
                "sortingDelay": "تأخير في الفرز",
                "highOrderVolume": "كمية طلبات كبيرة",
                "technicalIssue": "مشكلة تقنية"
              }
            },
            "delivered": "تم التوصيل",
            "received": "تم الاستلام",
            "delivered_received": "تم التوصيل / تم الاستلام"
          },
          "editPhone": "تعديل هاتف المستلم",
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
          "changeStatus": "تغيير الحالة",
          "changeStatusAlert": "أنت على وشك تغيير حالة الطرد إلى",
          "changeStatusAlertNote": "اكتب ملاحظة...",
          "changeStatusAlertConfirm": "تأكيد",
          "changeStatusAlertCancel": "إلغاء",
          "print": "طباعة",
          "location": "الموقع",
          "to_branch":"مرسل الى الفرع",
          "financialDetails": "التفاصيل المالية",
          "codValue": "تكلفة الطرد",
          "netValue": "المطلوب من التاجر",
          "deliveryFee": "تكلفة التوصيل",
          "checksAvailable": "الشيكات المتاحة",
          "note": "ملاحظة",
          "add_currency": "إضافة عملة أخرى",
          "orderActions": "إجراءات الطلب",
          "orderChecks": {
            "title": "شيكات الطلب",
            "orderId": "رقم الطلب",
            "loading": "جاري التحميل...",
            "totalChecks": "إجمالي الشيكات",
            "totalValue": "القيمة الإجمالية",
            "check": "شيك",
            "value": "القيمة",
            "currency": "العملة",
            "date": "التاريخ",
            "noChecks": "لا توجد شيكات",
            "noChecksMessage": "لا توجد شيكات مرتبطة بهذا الطلب.",
            "backToOrder": "رجوع",
            "checkDetails": "تفاصيل الشيك"
          }
        },
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
          sections: {
            referenceId:{
              title:"الرقم المرجعي (اختياري)",
              explain:"ضع رقم QR الخاص بك ان كان متوفرا"
            },
            sender: {
              title: "المرسل",
              fields: {
                sender: "المرسل",
                my_balance_deduct:"الخصم من رصيدي",
                sender_deduct:"الخصم من رصيد التاجر"
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
                address: "العنوان"
              }
            },
            cost: {
              title: "التكلفة",
              fields: {
                "packageCost": "تكلفة الطرد",
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
              fields: {
                product: "المنتج",
                quantity: "الكمية",
                weight: "الوزن",
                orderType: "نوع الطرد"
              }
            },
            orderTypes: {
              title: "نوع الطرد",
              delivery: "توصيل",
              receive: "استلام",
              "delivery/receive": "توصيل / استلام",
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
            "required": "هذا الحقل مطلوب"
          },
            "save": "حفظ التغييرات",
            "cancel": "إلغاء",
            "success": "تم بنجاح",
            "phoneUpdateSuccess": "تم تحديث أرقام الهاتف بنجاح",
            "error": "خطأ",
            "errorMsg": "حدث خطأ",
            "errorValidationMsg": "يرجى تصحيح الأخطاء في النموذج"
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
          logout: "تسجيل الخروج"
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
        returnedOut: "مرتجع خارجي",
        returnedDelivered: "تم تسليم المرتجع",
        completed: "مكتمل",
        moneyInBranch: "النقود في الفرع",
        moneyOut: "النقود خارجة",
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
        orders: "الطرود",
        "request_money": "اطلب أموالك",
        "prepare_money": "تجهيز اموالي",
        "send_money": "أرسل الأموال إلي",
        "request_package": "اطلب طردك",
        "prepare_package": "تجهيز طردي",
        "send_package": "أرسل الطرد إلي",
        "confirmPaymentMessage": "بإتمام هذه العملية، فإنك تؤكد أنك استلمت المبلغ، وأن الشركة لم تعد مسؤولة عن أي شكاوى لاحقة",
        "cancel": "إلغاء",
        "confirm": "تأكيد",
        "confirmReturnedMessage": "بإجراء هذا، فإنك تؤكد أنك استلمت الطرد، وأن الشركة لم تعد تتحمل أي مسؤولية بخصوص أي شكاوى لاحقة حول استلامه."
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
        edit: "تعديل"
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
        successMsg:"تم إنشاء المستخدم بنجاح",
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
        all: "الكل",
        open: "قيد المعالجة",
        closed: "مغلق"
      },
      ok:"موافق",
      order:"طرد",
      subjectPlaceholder:"أدخل عنوان الشكوى",
      describePlaceholder:"أدخل وصف مشكلتك",
      "noComplaints": "لا توجد شكاوى",
      "noComplaintsDesc": "لا توجد شكاوى تطابق الفلاتر الخاصة بك.",
      "newComplaint": "شكوى جديدة",
      "actions": "الإجراءات",
      "markAsResolved": "تمييز كمحلولة",
      "respond": "الرد على الشكوى",
      "viewDetails": "عرض التفاصيل",
      "loading": "جارٍ التحميل...",
      "notFoundTitle": "غير موجود",
      "goBack": "العودة",
      "issue": "المشكلة",
      "conversation": "المحادثة",
      "noMessages": "لا توجد رسائل بعد",
      "startConversation": "ابدأ المحادثة بإرسال رسالة",
      "you": "أنت",
      "supportAgent": "وكيل الدعم"
    },

    // Notifications
    notifications:{
      title:"الاشعارات",
      deleteAll:"مسح الكل",
      noNotifications:"لا يوجد اشعارات",
      order:"طلب"
    },

    // Search
    search: {
      placeholder: "بحث",
      by: "حسب",
      searchBy: "البحث حسب",
      searchByDate: "البحث حسب التاريخ",
      cancel: "إلغاء",
      confirm: "تأكيد"
    },

    // pickerModal
    picker: {
      choose: "اختر",
      cancel: "إلغاء",
      searchPlaceholder: "بحث"
    },

    // (camera)
    camera: {
      permission: {
        notGranted: "لم يتم منح إذن الكاميرا",
        request: "جارٍ طلب إذن الكاميرا..."
      },
      scanText: "ضع الباركود داخل الإطار",
      scanDuplicateTextError: "العنصر تم مسحه مسبقًا",
      scanInvalidTextError: "تنسيق مسح غير صالح",
      scanAgainTapText: "اضغط للمسح مرة أخرى",
      note: "اترك ملاحظة...",
      fromBranch: "من الفرع",
      toBranch: "إلى الفرع",
      confirm: "تأكيد",
      cancel: "إلغاء",
      totalScanned: "إجمالي الممسوح",
      enterOrderId:"ادخل الرقم التسلسلي للطرد",
      add:"اضافة",
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
      messenger: "ماسنجر",
      whatsapp: "واتساب",
      visitSite: "زيارة موقعنا الإلكتروني",
      openingHours:"ساعات العمل: 9:00 صباحًا - 10:00 مساءً",
      closingHours:"سنعود غدًا الساعة 9:00 صباحًا",
      connectWithUs:""
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
      },
      loading:"جاري التحميل..."
    },

    // greeting
    greeting: {
      morning: "صباح الخير! ☀️",
      afternoon: "مساء الخير! 🌤️",
      evening: "مساء الخير! 🌙"
    },

    // track
    track: {
      title: "تتبع حزمتك",
      desc: "أدخل رقم الطرد لبدء التتبع",
      placeholder: "مثال: 12321411"
    }
  },
  he: {
    // (auth)
    auth: {
      login: "התחברות",
      dontHaveAccount: "אין לך חשבון?",
      register: "הרשמה",
      username: "שם משתמש",
      mobileNumber: "מספר טלפון",
      email: "אימייל",
      password: "סיסמה",
      role:"התפקיד",
      city: "עיר",
      area: "אזור",
      address: "כתובת"
    },
    // (tabs)
    tabs:{
      index:{
        title:"לוח מחוונים",
        boxes:{
          todayOrders:"הזמנות היום",
          moneyInBranches:"כסף בסניפים",
          moneyInBranch:"כסף בסניף",
          moneyWithDrivers:"כסף עם נהגים",
          moneyWithDriver:"כסף עם נהג",
          inWaiting:"בהמתנה",
          inBranch:"בסניף",
          onTheWay:"בדרך",
          delivered:"נמסר",
          returned:"הוחזר",
          rescheduled:"נדחה מחדש",
          stuck:"תקוע",
          rejected:"נדחה",
          ofOrders:"מתוך הזמנות"
        }
      },
      orders:{
        title:"הזמנות",
        emptyArray:"אין הזמנות להצגה",
        filters:{
          // filterByGroup
          all:"הכל",
          waiting:"בהמתנה",
          rejected:"נדחה",
          inBranch:"בסניף",
          inProgress:"בתהליך",
          stuck:"תקוע",
          delayed:"מאוחר",
          onTheWay:"בדרך",
          rescheduled:"נדחה מחדש",
          returnBeforeDeliveredInitiated:"החזרה לפני תחילת המסירה",
          returnAfterDeliveredInitiated:"החזרה לאחר תחילת המסירה",
          returned:"הוחזר",
          returnedInBranch:"הוחזר בסניף",
          returnedOut:"הוחזר מחוץ לסניף",
          businessReturnedDelivered:"החזרה עסקית נמסרה",
          delivered:"נמסר",
          moneyInBranch:"כסף בסניף",
          moneyOut:"כסף מחוץ לסניף",
          businessPaid:"שולם לעסק",
          completed:"הושלם",
          // searchByGroup
          orderId:"מספר הזמנה",
          referenceID:"מספר מזהה",
          sender:"שולח",
          receiverName:"שם המקבל",
          receiverPhone:"טלפון המקבל",
          receiverCity:"עיר המקבל",
          receiverArea:"אזור המקבל",
          receiverAddress:"כתובת המקבל",
          driverName:"שם הנהג",
          // searchByDateGroup
          today:"היום",
          yesterday:"אתמול",
          thisWeek:"השבוע",
          thisMonth:"החודש",
          thisYear:"השנה",
          selectDate:"בחר תאריך",
        },
        order:{
          states:{
            pickedUp:"נאסף",
            deliveredToDestinationBranch:"נמסר לסניף היעד",
            reschedule:"לדחות מחדש",
            returnBeforeDeliveredInitiated:"החזרה לפני תחילת המסירה",
            returnAfterDeliveredInitiated:"החזרה לאחר תחילת המסירה",
            returned:"הוחזר",
            delivered:"נמסר",
            waiting:"בהמתנה",
            inBranch:"בסניף",
            inProgress:"בתהליך",
            rejected:"נדחה",
            stuck:"תקוע",
            delayed:"מאוחר"
          },
          userSenderBoxLabel:"שולח",
          userClientBoxLabel:"לקוח",
          userDriverBoxLabel:"נהג",
          userBoxPhoneContactLabel:"שיחה",
          userBoxMessageContactLabel:"הודעה",
          contactPhone:"טלפון",
          contactWhatsapp:"וואטסאפ",
          edit:"ערוך",
          changeStatus:"שנה סטטוס",
          changeStatusAlert:"אתה עומד לשנות את סטטוס ההזמנה ל",
          changeStatusAlertNote:"השאר הערה...",
          changeStatusAlertConfirm:"אישור",
          changeStatusAlertCancel:"ביטול",
          print:"הדפס"
        },
        // (create)
        create:{
          edit:"ערוך הזמנה",
          create:"צור הזמנה",
          submit:"שלח",
          sections:{
            sender:{
              title:"שולח",
              fields:{
                sender:"שולח",
              }
            },
            client:{
              title:"לקוח",
              fields:{
                client:"לקוח",
                firstPhone:"מספר טלפון",
                secondPhone:"מספר טלפון שני",
                city:"עיר",
                area:"אזור",
                address:"כתובת"
              }
            },
            cost:{
              title:"עלות",
              fields:{
                packageCost:"עלות החבילה",
                deliveryFee:"עמלת משלוח",
                isReplaced:"הוחלף",
              }
            },
            details:{
              title:"פרטי ההזמנה",
              fields:{
                product:"מוצר",
                quantity:"כמות",
                weight:"משקל",
                orderType:"סוג ההזמנה"
              }
            },
            orderTypes:{
              delivery:"Delivery",
              receive:"Receive",
              "delivery/receive":"Delivery / Recieve"
            },
            currencyList:{
              ILS:"ILS",
              USD:"USD",
              JOD:"JOD"
            },
            paymentType:{
              cash:"Cash",
              check:"Check",
              "cash/check":"Cash/Check"
            },
            itemsCotnentType:{
              normal:"Noraml"
            }
          }
        }
      },
      collections:{
        title:"גבייה",
        options:{
          collect:"גבה את הכסף שלך",
          money:"גביית כספים",
          driver:"גביית נהגים",
          returned:"גבייה מוחזרת",
          runsheet:"גביית גיליון ריצה",
        }
      },
      settings:{
        title:"הגדרות",
        options:{
          users:"משתמשים",
          language:{
            title:"שפה",
            options:{
              ar:"ערבית",
              en:"אנגלית",
              he:"עברית"
            }
          },
          changePassword:"שנה סיסמה",
          contactUs:"צור קשר",
          aboutUs:"אודותינו",
          locations:"מיקומים",
          logout:"התנתק"
        }
      }
    },

    // (collection)
    collections:{
      title:"גבייה",
      emptyArray:"אין גבייה להצגה",
      filters:{
        //filterByGroup
        all:"הכל",
        returnedInBranch:"הוחזר בסניף",
        deleted:"נמחק",
        returnedOut:"הוחזר מחוץ לסניף",
        returnedDelivered:"הוחזר ונמסר",
        completed:"הושלם",
        moneyInBranch:"כסף בסניף",
        moneyOut:"כסף מחוץ לסניף",
        paid:"שולם",
        pending:"ממתין",
        inDispatchedToBranch:"בתהליך משלוח לסניף",
        partial:"חלקי",
        returnedDelivered:"הוחזר ונמסר",
        // searchByGroup
        collectionId:"מספר גבייה",
        sender:"שולח",
        driver:"נהג",
        prevDriver:"נהג קודם",
        currentBranch:"סניף נוכחי",
        // searchByDateGroup
        today:"היום",
        yesterday:"אתמול",
        thisWeek:"השבוע",
        thisMonth:"החודש",
        thisYear:"השנה",
        selectDate:"בחר תאריך"
      },
      collection:{
        numberOfOrders:"מספר הזמנות",
        numberOfCollections:"מספר גבייה",
        moneyToDeliver:"כסף למסירה",
        moneyToCollect:"כסף לגבייה",
        checksToDeliver:"צ'קים למסירה",
        currentBranch:"סניף נוכחי",
        toBranch:"לסניף",
        print:"הדפס",
        collections:"גבייה",
        orders:"הזמנות",
      }
    },

    // (users)
    users:{
      title:"משתמשים",
      emptyArray:"אין משתמשים להצגה",
      filters:{
        // filterByGroup
        all:"הכל",
        active:"פעיל",
        inactive:"לא פעיל",
        //searchByGroup
        userId:"מספר משתמש",
        name:"שם",
        commercial:"שם מסחרי",
        email:"אימייל",
        phone:"טלפון",
        branch:"סניף",
        role:"תפקיד",
        city:"עיר",
        area:"אזור",
        address:"כתובת",
        //searchByDateGroup
        today:"היום",
        yesterday:"אתמול",
        thisWeek:"השבוע",
        thisMonth:"החודש",
        thisYear:"השנה",
        selectDate:"בחר תאריך",
      },
      user:{
        name:"שם",
        role:"תפקיד",
        edit:"ערוך"
      },
      //(create_user)
      create:{
        edit:"ערוך משתמש",
        create:"צור משתמש",
        submit:"שלח",
        sections:{
          user:{
            title:"משתמש",
            fields:{
              name:"שם",
              commercial:"שם מסחרי",
              firstPhone:"מספר טלפון",
              secondPhone:"מספר טלפון שני",
              affillator:"שותף",
              city:"עיר",
              area:"אזור",
              address:"כתובת",
            }
          },
          details:{
            title:"פרטים",
            fields:{
              role:"תפקיד",
              pricelist:"רשימת מחירים"
            }
          }
        }
      }
    },

    // Search
    search:{
      placeholder:"חיפוש",
      by:"לפי",
      searchBy:"חפש לפי",
      searchByDate:"חפש לפי תאריך",
      cancel:"ביטול",
      confirm:"אישור"
    },

    // pickerModal
    picker:{
      choose:"בחר",
      cancel:"ביטול",
      searchPlaceholder:"חיפוש"
    },

    // (camera)
    camera:{
      permission:{
        notGranted:"אין הרשאה למצלמה",
        request:"מבקש הרשאה למצלמה...",
      },
      scanText:"הנח ברקוד בתוך המסגרת",
      scanDuplicateTextError:"הפריט כבר נסרק",
      scanInvalidTextError:"פורמט סריקה לא תקין",
      scanAgainTapText:"הקש כדי לסרוק שוב",
      note:"השאר הערה...",
      fromBranch:"מסניף",
      toBranch:"לסניף",
      confirm:"אישור",
      cancel:"ביטול",
      totalScanned:"סה\"כ נסרק"
    },

    // (change_password)
    chnagePassword:{
      title:"שנה סיסמה",
      currentPass:"סיסמה נוכחית",
      currentPassHint:"הזן את הסיסמה הנוכחית שלך המשמשת להתחברות",
      newPass:"סיסמה חדשה",
      changePass:"שנה סיסמה"
    },

    // (contact_us)
    contact:{
      title:"צור קשר",
      open:"פתוח",
      closed:"סגור",
      weAre:"אנחנו",
      now:"עכשיו",
      local:"מקומי",
      facebook:"פייסבוק",
      messenger:"מסנג'ר",
      whatsapp:"וואטסאפ",
      visitSite:"בקר באתר שלנו"
    },

    // (about_us)
    about:{
      title:"אודותינו",
      aboutLabel:"אודות חברת טייאר",
      aboutDesc:"בטייאר, אנו מתמחים במשלוח חבילות באיכות גבוהה ברחבי הגדה המערבית, ירושלים וארץ 48. המשימה שלנו היא לספק פתרונות משלוח מהירים, אמינים ובטוחים המותאמים לצרכים שלך. בין אם מדובר במשלוחים עסקיים או משלוחים אישיים, אנו מבטיחים שכל חבילה תגיע ליעדה בבטחה ובזמן. עם מחויבות למצוינות ולשביעות רצון הלקוחות, טייאר היא השותף האמין שלך ללוגיסטיקה חלקה. התנסה במשלוח ללא טרחה עם צוות שנותן עדיפות ליעילות ולטיפול.",
    },

    // (locations)
    locations:{
      title:"מיקומים",
      tulkarm:{
        title:"טול כרם",
        desc:"המיקום המרכזי"
      },
      hebron:{
        title:"חברון",
        desc:"מרכז משלוחים בחברון"
      },
      ramallah:{
        title:"רמאללה",
        desc:"מרכז משלוחים ברמאללה"
      },
      jenin:{
        title:"ג'נין",
        desc:"מרכז משלוחים בג'נין"
      }
    },

    // greeting
    greeting:{
      morning:"בוקר טוב! ☀️",
      afternoon:"צהריים טובים! 🌤️",
      evening:"ערב טוב! 🌙"
    },

    // track
    track:{
      title:"עקוב אחר החבילה שלך",
      desc:"הזן מספר הזמנה כדי להתחיל במעקב",
      placeholder:"לדוגמה: 12321411",
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("ar");
  const [loading, setLoading] = useState(true);

  // switch language & trigger full native restart if direction changed
  const setLanguage = async (newLanguage) => {
    setLanguageState(newLanguage);
    await saveToken('language', newLanguage);
  
    const shouldBeRTL = newLanguage === 'ar' || newLanguage === 'he';
    await saveToken('isRTL', shouldBeRTL.toString()); // Save RTL direction

  };

  useEffect(() => {
    (async () => {
      const saved = await getToken('language');
      if (saved){
        setLanguageState(saved)
      }
      setLoading(false);
    })();
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
    <LanguageContext.Provider value={{ language, setLanguage, getTranslation }}>
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