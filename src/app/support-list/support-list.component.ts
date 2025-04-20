import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
interface DayExpectations {
  dayId: number;
  expectations: string[];
}
interface DayExpectationsMap {
  [key: string]: string[];
}
interface ModelInfo {
  expectations: string[];
  time: string; // Format: "2h30", "45min", etc.
}

@Component({
  selector: 'app-support-list',
  templateUrl: './support-list.component.html',
  styleUrls: ['./support-list.component.css']
})
// Dans votre composant


// Définition statique des expectations par jour

export class SupportListComponent implements OnInit {
  allMetadata: any[] = [];
  groupedMetadata: Record<string, Record<string, any[]>> = {};
  expandedModel: string | null = null; // Modèle actuellement agrandi
  isExpanded = false;
  modelName: any;
  
getObjectKeys(obj: any): string[] {
  return Object.keys(obj);
}

dayExpectations: DayExpectationsMap = {
  '1': [
    " To inform trainee about work environment and his important role inside Yazaki\n  إعلام المتدرب ببيئة العمل ودوره الهام داخل يازاكي"
  ],
  '2': [
    " To learn overall production steps, quality importance and workstation rules\n  تعلم خطوات الإنتاج العامة، أهمية الجودة وقواعد العمل في المحطة"
  ],
  '0': [
    " To inform trainee about duties and rights\n  إعلام المتدرب بالواجبات والحقوق"
  ]
};

modelInfos: { [key: string]: ModelInfo } = {
  'code of conduct': {
    expectations: [
      " To Learn about local internal rules, regional code of conduct, conflict of interest - bribery politic                                                      / التعرف على القوانين الداخلية المحلية، مدونة السلوك الإقليمية، تضارب المصالح - الرشوة والسياسة"
    ],
    time: "1h00"
  },
  'type of contracts': {
    expectations: [
      "To Learn about local types of contracts / التعرف على أنواع العقود المحلية"
    ],
    time: "5 min"
  },
  'General Affairs': {
    expectations: [
      " To Learn about general affairs duties and rights: working hour, canteen, cloakroom, mosque / التعرف على واجبات وحقوق الشؤون العامة: ساعات العمل، المقصف، غرفة تبديل الملابس، المسجد"
    ],
    time: "10 min"
  },
  'health insurance': {
    expectations: [
      "Understand health insurance coverage / فهم تغطية التأمين الصحي",
      " Know how to submit claims / معرفة كيفية تقديم المطالبات",
      " Know specific benefits / معرفة المزايا الخاصة"
    ],
    time: "15min"
  },
  'cnss': {
    expectations: [
      "To Learn about local social security fund / التعرف على صندوق الضمان الاجتماعي المحلي"
    ],
    time: "5 min"
  },
  'welcome': {
    expectations: [
      " To ice-break the first contact with introduction of trainer and trainees / لكسر الحاجز في اللقاء الأول مع تقديم المدرب والمتدربين"
    ],
    time: "15 min"
  },
  'key messages': {
    expectations: [
      " To Have key messages of each module in booklet in which trainee can add notes / الحصول على الرسائل الرئيسية لكل وحدة في كتيب يمكن للمتدرب تدوين الملاحظات فيه"
    ],
    time: "5min"
  },
  'company Context': {
    expectations: [
      "To Know about Yazaki worldwide, history, policy, values and actual company / التعرف على شركة Yazaki على المستوى العالمي، تاريخها، سياساتها، قيمها والشركة الحالية"
    ],
    time: "45 min"
  },
  'Added value of operator': {
    expectations: [
      " To Feel the importance of trainee in society as producer of all cars WH / الإحساس بأهمية المتدرب في المجتمع كمنتج لكافة ضفائر السيارات"
    ],
    time: "45 min"
  },
  'health and safety': {
    expectations: [
      " To Learn about Health and Safety overview and general consigns / التعرف على نظرة عامة حول الصحة والسلامة والتعليمات العامة",
      "To Learn about Health and Safety IPE in showcase / التعرف على معدات الحماية الفردية في عرض خاص"
    ],
    time: "2h50min"
  },
  'WH Production Flow': {
    expectations: [
      " To Learn overall WH manufacturing Flow from Supplier to customer including WH mounting car / التعرف على تدفق تصنيع الضفائر من المورد إلى الزبون بما في ذلك تركيبها في السيارة",
      " To See where and how exactly the WH is mounted on the car / معرفة أين وكيف يتم تركيب الضفيرة في السيارة",
      " To observe overall manufacturing flow in real areas / ملاحظة تدفق التصنيع الفعلي في المناطق الحقيقية"
    ],
    time: "1h35min"
  },
  'Good car comes from good WH': {
    expectations: [
      " To Feel the importance of quality in front of the final car driver / الإحساس بأهمية الجودة أمام سائق السيارة النهائي"
    ],
    time: "5 min"
  },
  '5 s': {
    expectations: [
      " To Learn about 5S: what to do and what not do in workstation / التعرف على 5S: ما يجب وما لا يجب فعله في مكان العمل"
    ],
    time: "30 min"
  },
  '7 Muda': {
    expectations: [
      " To Learn about 7 Muda: what to do and what not do in workstation / التعرف على 7 أنواع من الهدر: ما يجب وما لا يجب فعله في مكان العمل"
    ],
    time: "1h10min"
  },
  'Gemba Rules': {
    expectations: [
      "To Learn about Gemba rules: what to do and what not do in shopfloor / التعرف على قواعد جيمبا: ما يجب وما لا يجب فعله في ورشة العمل",
      " To Learn about different Yazaki uniforms, colors and purposes / التعرف على الزي الرسمي الخاص بـ Yazaki، ألوانه واستخداماته المختلفة"
    ],
    time: "50min"
  },
  'production process and material': {
    expectations: [
      " To Learn about production flow process and material used for each step / التعرف على مراحل عملية الإنتاج والمواد المستخدمة في كل خطوة",
      " To simulate and feel with touch the components used in production / محاكاة ولمس المكونات المستخدمة في الإنتاج"
    ],
    time: "1h40min"
  },
  'YAZAKI Image': {
    expectations: [
      " To Feel the importance of operator building Quality in front of Customer as YAZAKI image / الإحساس بأهمية دور العامل في بناء الجودة أمام الزبون كصورة لشركة Yazaki"
    ],
    time: "5 min"
  },
  'Andon': {
    expectations: [
      " To Learn how to manage abnormalities in workstation using Andon tower / التعرف على كيفية التعامل مع الحالات غير الطبيعية في مكان العمل باستخدام برج Andon"
    ],
    time: "15 min"
  },
  'Quality': {
    expectations: [
      " To Learn about quality targets and different defects / التعرف على أهداف الجودة وأنواع العيوب المختلفة",
      " To simulate and feel with touch top 4 defects in the plant / محاكاة ولمس أكثر 4 عيوب شيوعًا في المصنع"
    ],
    time: "30 min"
  },
  'Environment': {
    expectations: [
      " To Learn about Environment overview / التعرف على لمحة عامة عن البيئة"
    ],
    time: "1h50min"
  },
  'Special processes': {
    expectations: [
      " To Learn about special process in criticality on WH and car driver / التعرف على العمليات الخاصة وتأثيرها الحرج على الضفيرة وسائق السيارة"
    ],
    time: "45 min"
  }
};


getDayExpectations(day: string): string[] {
  return this.dayExpectations[day] || [];
}

  // modelImages: { [key: string]: string } = {
  //   'code of conduct': 'https://cdn3.iconfinder.com/data/icons/gdpr-aesthetics-vol-1/256/Code_of_Conduct-512.png',
  //   'type of contracts': 'https://cdn-icons-png.flaticon.com/512/9577/9577463.png',
  //   'General Affairs': 'https://tse2.mm.bing.net/th?id=OIP.OoBtfHUFJSx6zJLFoUz68AHaHa&pid=Api&P=0&h=180',
  //   'health insurance': 'https://cdn-icons-png.flaticon.com/512/8444/8444051.png',
  //   'cnss': 'https://cnss.dj/wp-content/uploads/2021/12/logo-cnss.png',
  //   'welcome': 'https://vectorified.com/images/welcome-icon-png-10.png',
  //   'key messages': 'https://cdn0.iconfinder.com/data/icons/mail-message-2/512/Mail-06-256.png',
  //   'company Context':'https://cdn-icons-png.freepik.com/256/5241/5241656.png?semt=ais_hybrid',
  //   'health and safety': 'https://cdn2.iconfinder.com/data/icons/medicine-and-medical-diagnostics-1/32/Medicine_health_and_safety_care_health_insurance-1024.png',
  //   'WH Production Flow': 'https://cdn4.iconfinder.com/data/icons/popicon-business-bluetone-part-4/256/11-512.png',
  //   'Good car comes from good WH': 'https://cdn1.iconfinder.com/data/icons/supply-chain-management/64/logistics_car_assembly-1024.png',
  //   '5 s': 'https://cdn-icons-png.flaticon.com/512/9584/9584507.png',
  //   '7 Muda': 'https://www.sesa-systems.com/media/wysiwyg/img/muda/MUDA.png',
  //   'Gemba Rules': 'http://icons.iconarchive.com/icons/vexels/office/1024/rules-icon.png',
  //   'production process and material': 'https://cdn4.iconfinder.com/data/icons/consumer-behaviour-4/64/production-concept-manufacturing-industrial-process-1024.png',
  //   'YAZAKI Image': 'https://img.icons8.com/clouds/2x/yazaki.png',
  //   'Andon': 'https://www.shopflooriq.com/wp-content/uploads/brizy/6925/assets/images/iW=352&iH=1368&oX=0&oY=2&cW=352&cH=1364/SF-Andon-Light.png',
  //   'Quality': 'https://cdn3.iconfinder.com/data/icons/interview-4/128/a_best_quality_quality_assurance_quality_guarantee_ribbon-1024.png',
  //   'Environment': 'https://cdn1.iconfinder.com/data/icons/nature-3/102/Environmental-3-1024.png',
  //   'Special processes': 'https://cdn-icons-png.flaticon.com/512/5810/5810302.png',
  //   'Added value of operator': 'https://cdn3.iconfinder.com/data/icons/construction-worker-and-engineer-1/512/919-45-1024.png',
  // };
  modelImages: { [key: string]: string } = {
    'code of conduct': 'https://www.corporatecomplianceinsights.com/wp-content/uploads/2018/07/code-of-conduct-on-keyboard-750x500.jpg',
    'type of contracts': 'https://f.hellowork.com/blogdumoderateur/2023/07/rediger-contrat-elements-indispensables.jpg',
    'General Affairs': 'https://www.talenta.co/wp-content/uploads/2019/10/shutterstock_628172654.jpg',
    'health insurance': 'https://www.macombgov.org/sites/default/files/styles/960x540/public/images/2022-10/Health_HealthInsurance_10052022.jpg?h=ac3f60f1&itok=0Lr4ojZF',
    'cnss': 'https://tse4.mm.bing.net/th?id=OIP.O1FmJ6t3xOgZCPnYuBvvjAHaD4&pid=Api&P=0&h=180',
    'welcome': 'https://assets.annahar.com/ContentFilesArchive/719984Image1-1180x677_d.jpg',
    'key messages': 'https://tse1.mm.bing.net/th?id=OIP.eXg2oWi-oGudGiWERLxrpgHaE8&pid=Api&P=0&h=180',
    'company Context':'https://media.licdn.com/dms/image/v2/C4E05AQE14Amx_eiwcA/feedshare-thumbnail_720_1280/feedshare-thumbnail_720_1280/0/1640280672526?e=2147483647&v=beta&t=iHxT9Jvg9bdBYYPqP6HGBmKj1EsyXtRaxwoE7fjgJwg',
    'health and safety': 'https://images.ctfassets.net/tfio2c4e6qit/4imfAynXxC23EhekewLT96/bc3f93d513a2ee196896367b17be3a4c/GettyImages-1408431931.jpg',
    'WH Production Flow': 'https://tse1.mm.bing.net/th?id=OIP.2UOei6zWD4vZriQnHgUD5QHaGK&pid=Api&P=0&h=180',
    'Good car comes from good WH': 'https://tse3.mm.bing.net/th?id=OIP.PdrzJqYfGxqMFQVinhCNvAHaDX&pid=Api&P=0&h=180',
    '5 s': 'https://tse4.mm.bing.net/th?id=OIP.WDXrrhqB21oCA8YwdxQ6BAHaEc&pid=Api&P=0&h=180',
    '7 Muda': 'https://kanbanize.com/wp-content/uploads/website-images/kanban-resources/7-wastes-lean.png',
    'Gemba Rules': 'https://tse3.mm.bing.net/th?id=OIP.PWY86jSvztON6KKvEkrePwHaCn&pid=Api&P=0&h=180',
    'production process and material': 'https://tse3.mm.bing.net/th?id=OIP.XWNDBbpSWAr12xmrGp7TDAHaE7&pid=Api&P=0&h=180',
    'YAZAKI Image': 'https://img.icons8.com/clouds/2x/yazaki.png',
    'Andon': 'https://tse1.mm.bing.net/th?id=OIP.CP7Iy79CIeNEkOe5ZDSkeAHaEH&pid=Api&P=0&h=180',
    'Quality': 'https://tse1.mm.bing.net/th?id=OIP.bEJLS4_xmJ-rKD19JPvJGwHaE8&pid=Api&P=0&h=180',
    'Environment': 'https://tse4.mm.bing.net/th?id=OIP._AR5P51ofX6lXxofc3M70QHaE5&pid=Api&P=0&h=180',
    'Special processes': 'https://tse1.mm.bing.net/th?id=OIP.8XT9e9pYYiNmnQVZniwfdAHaDt&pid=Api&P=0&h=180',
    'Added value of operator': 'https://tse3.mm.bing.net/th?id=OIP.oqpGy0gCfEZ4USicZBz60wHaE8&pid=Api&P=0&h=180',
  }; 
  
  constructor(private http: HttpClient,private router:Router,private route:ActivatedRoute) {
    this.modelName = this.route.snapshot.paramMap.get('modelName')!;
  }

  ngOnInit(): void {
    this.fetchAllMetadata();
  }
  

  expandCard() {
    this.isExpanded = true;
  }

  closeCard() {
    this.isExpanded = false;
  }
  fetchAllMetadata() {
    this.http.get<any>('http://localhost:5000/supp/supports/metadata/all').subscribe(
      (response) => {
        if (response && response.metadata) {
          this.allMetadata = response.metadata;
          this.groupMetadataByDayAndModel();
        } else {
          console.error('Données mal formatées');
        }
      },
      (error) => {
        console.error('Erreur de récupération des métadonnées:', error);
      }
    );
  }

  groupMetadataByDayAndModel() {
    this.groupedMetadata = this.allMetadata.reduce((acc, support) => {
      const day = support.model_day || 0;
      const modelName = support.model_name;

      if (!acc[day]) {
        acc[day] = {};
      }

      if (!acc[day][modelName]) {
        acc[day][modelName] = [];
      }

      acc[day][modelName].push(support);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
  }

  // Méthode pour agrandir ou réduire un modèle
toggleModel(modelName: string): void {
  this.router.navigate(['/model-detail', modelName]);
}
viewSupport(support: any) {
  // Construire l'URL avec les paramètres filename et model_name
  const url = `http://localhost:5000/supp/supports/view?model_name=${encodeURIComponent(support.model_name)}&filename=${encodeURIComponent(support.filename)}`;

  // Ouvrir l'URL dans le même onglet
  window.location.href = url;
}

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

}