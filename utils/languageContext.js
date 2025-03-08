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
      role:"Role"
    },

    // (tabs)
    tabs:{
      index:{
        title:"Dashboard",
        boxes:{
          todayOrders:"Today Orders",
          moneyInBranches:"Money in Branches",
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
          unknown:"Unknown"
        },
        order:{
          states:{
            pickedUp:"Picked Up",
            deliveredToDestinationBranch:"delivered to Destination Branch",
            reschedule:"reschedule",
            returnBeforeDeliveredInitiated:"Return Before Delivered Initiated",
            returnAfterDeliveredInitiated:"Return After Delivered Initiated",
            returned:"Returned",
            delivered:"Delivered",
            waiting:"Waiting",
            inBranch:"In Branch",
            inProgress:"In Progress",
            rejected:"Rejected",
            stuck:"Stuck",
            delayed:"Delayed"
          },
          orderType:"Order Type",
          unknown:"Unknown",
          userSenderBoxLabel:"Sender",
          userClientBoxLabel:"Client",
          userDriverBoxLabel:"Driver",
          userBoxPhoneContactLabel:"Call",
          userBoxMessageContactLabel:"Message",
          contactPhone:"Phone",
          contactWhatsapp:"Whatsapp",
          edit:"Edit",
          changeStatus:"Change Status",
          changeStatusAlert:"You are going to change this order status into",
          changeStatusAlertNote:"Leave a note...",
          changeStatusAlertConfirm:"Confirm",
          changeStatusAlertCancel:"Cancel",
          print:"Print"
        },
        // (create)
        create:{
          edit:"Edit Order",
          create:"Create Order",
          submit:"Submit",
          sections:{
            sender:{
              title:"Sender",
              fields:{
                sender:"Sender",
              }
            },
            client:{
              title:"Client",
              fields:{
                client:"Client",
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
          }
        }
      },
      collections:{
        title:"Collections",
        options:{
          collect:"Collect Your Money",
          money:"Money Collections",
          driver:"Driver Collections",
          returned:"Returned Collections",
          runsheet:"Runsheet Collections",
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
          contactUs:"Contact Us",
          aboutUs:"About Us",
          locations:"Locations",
          logout:"Logout"
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
        moneyToCollect:"Money to Collect",
        checksToDeliver:"Checks to Deliver",
        currentBranch:"Current Branch",
        toBranch:"To Branch",
        print:"Print",
        collections:"Collections",
        orders:"Orders",
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
              pricelist:"Price List"
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
      }
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
      totalScanned:"Total Scanned"
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
      visitSite:"Visit Out Website"
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
      role: "الدور"
    },

    // (tabs)
    tabs: {
      index: {
        title: "لوحة التحكم",
        boxes: {
          todayOrders: "طلبات اليوم",
          moneyInBranches: "النقود في الفروع",
          moneyInBranch: "النقود في الفرع",
          moneyWithDrivers: "النقود مع السائقين",
          moneyWithDriver: "النقود مع السائق",
          inWaiting: "في الانتظار",
          inBranch: "في الفرع",
          onTheWay: "في الطريق",
          delivered: "تم التسليم",
          returned: "مرتجع",
          rescheduled: "معاد جدولته",
          stuck: "عالق",
          rejected: "مرفوض",
          ofOrders: "من الطلبات"
        }
      },
      orders: {
        title: "الطلبات",
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
          businessReturnedDelivered: "مرتجع تم تسليمه للأعمال",
          delivered: "تم التسليم",
          moneyInBranch: "النقود في الفرع",
          moneyOut: "النقود خارجة",
          businessPaid: "تم الدفع للأعمال",
          completed: "مكتمل",
          // searchByGroup
          orderId: "معرف الطلب",
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
          orderTracking: "تتبع الطلب",
          order: "الطلب",
          package: "الحزمة",
          quantity: "الكمية",
          weight: "الوزن",
          receivedItems: "العناصر المستلمة",
          receivedQuantity: "الكمية المستلمة",
          deliveryStatus: "حالة التوصيل",
          branch: "الفرع",
          issue: "هل لديك مشكلة؟ قدم شكوى",
          openCase: "فتح شكوى",
          unknown: "غير معروف"
        },
        order: {
          states: {
            pickedUp: "تم الاستلام",
            deliveredToDestinationBranch: "تم التسليم إلى فرع الوجهة",
            reschedule: "إعادة جدولة",
            returnBeforeDeliveredInitiated: "بدء الإرجاع قبل التسليم",
            returnAfterDeliveredInitiated: "بدء الإرجاع بعد التسليم",
            returned: "مرتجع",
            delivered: "تم التسليم",
            waiting: "في الانتظار",
            inBranch: "في الفرع",
            inProgress: "قيد التنفيذ",
            rejected: "مرفوض",
            stuck: "عالق",
            delayed: "متأخر"
          },
          orderType: "نوع الطلب",
          unknown: "غير معروف",
          userSenderBoxLabel: "المرسل",
          userClientBoxLabel: "الزبون",
          userDriverBoxLabel: "السائق",
          userBoxPhoneContactLabel: "اتصال",
          userBoxMessageContactLabel: "رسالة",
          contactPhone: "الهاتف",
          contactWhatsapp: "واتساب",
          edit: "تعديل",
          changeStatus: "تغيير الحالة",
          changeStatusAlert: "أنت على وشك تغيير حالة هذا الطلب إلى",
          changeStatusAlertNote: "اترك ملاحظة...",
          changeStatusAlertConfirm: "تأكيد",
          changeStatusAlertCancel: "إلغاء",
          print: "طباعة"
        },
        // (create)
        create: {
          edit: "تعديل الطلب",
          create: "إنشاء طلب",
          submit: "إرسال",
          sections: {
            sender: {
              title: "المرسل",
              fields: {
                sender: "المرسل"
              }
            },
            client: {
              title: "الزبون",
              fields: {
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
                packageCost: "تكلفة الحزمة",
                deliveryFee: "رسوم التوصيل",
                isReplaced: "تم استبداله"
              }
            },
            details: {
              title: "تفاصيل الطلب",
              fields: {
                product: "المنتج",
                quantity: "الكمية",
                weight: "الوزن",
                orderType: "نوع الطلب"
              }
            },
            orderTypes: {
              title: "نوع الطلب",
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
          }
        }
      },
      collections: {
        title: "التجميعات",
        options: {
          collect: "اجمع نقودك",
          money: "تجميعات النقود",
          driver: "تجميعات السائق",
          returned: "تجميعات المرتجعات",
          runsheet: "تجميعات ورقة التسليم"
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
        numberOfOrders: "عدد الطلبات",
        numberOfCollections: "عدد التجميعات",
        moneyToDeliver: "النقود للتسليم",
        moneyToCollect: "النقود للجمع",
        checksToDeliver: "الشيكات للتسليم",
        currentBranch: "الفرع الحالي",
        toBranch: "الفرع المرسل إليه",
        print: "طباعة",
        collections: "التجميعات",
        orders: "الطلبات"
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
        sections: {
          user: {
            title: "المستخدم",
            fields: {
              name: "الاسم",
              commercial: "الاسم التجاري",
              firstPhone: "رقم الهاتف",
              secondPhone: "رقم الهاتف الثاني",
              affillator: "الشريك",
              city: "المدينة",
              area: "المنطقة",
              address: "العنوان"
            }
          },
          details: {
            title: "التفاصيل",
            fields: {
              role: "الدور",
              pricelist: "قائمة الأسعار"
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
      orderId: "معرف الطلب",
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
      }
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
      totalScanned: "إجمالي الممسوح"
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
      open: "مفتوح",
      closed: "مغلق",
      weAre: "نحن",
      now: "الآن",
      local: "محلي",
      facebook: "فيسبوك",
      messenger: "ماسنجر",
      whatsapp: "واتساب",
      visitSite: "زيارة موقعنا الإلكتروني"
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
      title: "تتبع حزمتك",
      desc: "أدخل رقم الطلب لبدء التتبع",
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
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await getToken('userLanguage');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const handleSetLanguage = async (newLanguage) => {
    try {
      await saveToken('userLanguage', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="50" color="#F8C332" />
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
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