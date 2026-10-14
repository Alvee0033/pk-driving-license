'use client';

import React, { useState, useEffect } from 'react';

interface LicenseRecord {
  cnic: string;
  name: string;
  father_name: string;
  dl_no: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  district: string;
  idp: string;
  initial_type_date: string;
}

const DEFAULT_RECORD: LicenseRecord = {
  cnic: '1560404318045',
  name: 'Ahmad Khan',
  father_name: 'Gul Hamad',
  dl_no: '110200123565',
  license_type: 'M.CAR,LTV',
  issue_date: '14-01-2021',
  expiry_date: '13-01-2026',
  district: 'Peshawar',
  idp: 'Not Issued',
  initial_type_date: 'M.CAR,LTV / 14-01-2021',
};

const GALLERY_ITEMS = [
  { src: '/images/WhatsApp Image 2022-07-21 at 3.21.45 PM (1).jpeg', alt: 'Gallery 1' },
  { src: '/images/WhatsApp Image 2022-07-16 at 11.01.43 AM.jpeg', alt: 'Gallery 2' },
  { src: '/images/Presentation1_0.jpg', alt: 'Gallery 3' },
  { src: '/images/WhatsApp Image 2022-07-05 at 4.00.52 PM.jpeg', alt: 'Gallery 4' },
  { src: '/images/WhatsApp Image 2022-07-02 at 11.50.50 AM.jpeg', alt: 'Gallery 5' },
  { src: '/images/Crime 1.jpg', alt: 'Gallery 6' },
  { src: '/images/Head Money.jpg', alt: 'Gallery 7' },
  { src: '/images/1000.jpg', alt: 'Gallery 8' },
  { src: '/images/100.jpg', alt: 'Gallery 9' },
  { src: '/images/web 6.jpg', alt: 'Gallery 10' },
  { src: '/images/c-1.jpg', alt: 'Gallery 11' },
  { src: '/images/delegation_0.jpg', alt: 'Gallery 12' },
  { src: '/images/A-1_0.jpg', alt: 'Gallery 13' },
  { src: '/images/Events 6_0.jpg', alt: 'Gallery 14' },
  { src: '/images/web 2.jpg', alt: 'Gallery 15' },
  { src: '/images/Shuhada_2.jpg', alt: 'Gallery 16' },
];

export default function VerificationPage() {
  const [searchValue, setSearchValue] = useState('');
  const [record, setRecord] = useState<LicenseRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [galleryPairIdx, setGalleryPairIdx] = useState(0);
  const [isGalleryHovered, setIsGalleryHovered] = useState(false);

  const totalPairs = Math.ceil(GALLERY_ITEMS.length / 2);

  // Auto-play carousel every 3.5s unless hovered
  useEffect(() => {
    if (isGalleryHovered) return;
    const timer = setInterval(() => {
      setGalleryPairIdx((prev) => (prev + 1) % totalPairs);
    }, 3500);
    return () => clearInterval(timer);
  }, [isGalleryHovered, totalPairs]);

  const handlePrevGallery = () => {
    setGalleryPairIdx((prev) => (prev > 0 ? prev - 1 : totalPairs - 1));
  };

  const handleNextGallery = () => {
    setGalleryPairIdx((prev) => (prev + 1) % totalPairs);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let q = params.get('search') || params.get('q') || params.get('cnic') || params.get('dl_no');
      if (!q) {
        const match = window.location.pathname.match(/\/dl-status\/([^\/]+)/);
        if (match && match[1]) {
          q = decodeURIComponent(match[1]);
        }
      }
      if (q && q.trim()) {
        setHasSearched(true);
        performLookup(q);
      } else {
        setHasSearched(false);
        setRecord(null);
      }
    }
  }, []);

  const performLookup = async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setRecord(null);
      return;
    }

    try {
      const res = await fetch(`/api/licenses?search=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data && data.found && data.license) {
        setRecord(data.license);
      } else if (clean.includes('110200123565') || clean.includes('1560404318045')) {
        setRecord(DEFAULT_RECORD);
      } else {
        setRecord(null);
      }
    } catch {
      if (clean.includes('110200123565') || clean.includes('1560404318045')) {
        setRecord(DEFAULT_RECORD);
      } else {
        setRecord(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('search', searchValue);
      url.searchParams.set('sub', '');
      window.history.pushState({}, '', url.toString());
    }
    performLookup(searchValue);
  };

  return (
    <div className="html front not-logged-in no-sidebars page-node" style={{ backgroundColor: '#fff', color: '#333' }}>
      <link rel="stylesheet" href="/css/system.base.css" />
      <link rel="stylesheet" href="/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/css/overrides.css" />

      <style jsx global>{`
        body {
          background-color: #fff !important;
          color: #333 !important;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          font-size: 14px !important;
          line-height: 1.42857143 !important;
        }
        .responsives {
          max-width: 100%;
          height: auto;
        }
        .table td, .table th {
          border: 1px solid #ddd !important;
          padding: 8px !important;
        }
        .table-bordered {
          border: 1px solid #ddd !important;
        }
        .table tr:nth-child(even) { background-color: #f2f2f2 !important; }
        .table tr { background-color: #fff !important; }
        .table tr:hover { background-color: #fff !important; }

        .navbar-default {
          background-color: #fff !important;
          border: none !important;
        }
        .navbar.container {
          margin-top: 20px;
        }
        @media screen and (min-width: 768px) {
          .navbar.container { max-width: 720px; }
        }
        @media screen and (min-width: 992px) {
          .navbar.container { max-width: 940px; }
        }
        @media screen and (min-width: 1200px) {
          .navbar.container { max-width: 1170px; }
        }

        .navbar-toggle {
          display: none;
          float: right;
          padding: 9px 10px;
          margin-top: 8px;
          margin-right: 15px;
          margin-bottom: 8px;
          background-color: transparent;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .navbar-toggle .icon-bar {
          display: block;
          width: 22px;
          height: 2px;
          background-color: #888;
          border-radius: 1px;
        }
        .navbar-toggle .icon-bar + .icon-bar {
          margin-top: 4px;
        }

        @media (max-width: 767px) {
          .navbar-toggle {
            display: block;
          }
          .navbar-collapse.collapse {
            display: none !important;
          }
          .navbar-collapse.in {
            display: block !important;
            clear: both;
          }
          .nav.navbar-nav {
            float: none !important;
            margin: 7.5px -15px;
          }
          .nav.navbar-nav > li {
            float: none;
          }
          .nav.navbar-nav > li > a {
            padding-top: 10px;
            padding-bottom: 10px;
            color: #777;
          }
        }

        @media (min-width: 768px) {
          .navbar-header {
            float: left;
          }
          .navbar-collapse.collapse {
            display: block !important;
            height: auto !important;
            padding-bottom: 0;
            overflow: visible !important;
            float: right;
            margin-top: 15px;
          }
          .navbar-nav {
            float: right;
            margin: 0;
          }
          .navbar-nav > li {
            float: left;
          }
          .navbar-nav > li > a {
            padding: 15px 12px;
            color: #777;
            font-size: 14px;
          }
          .navbar-nav > li > a:hover {
            color: #333;
          }
        }

        .btn-default {
          color: #fff !important;
          background-color: #ea0000 !important;
          border-color: #ea0000 !important;
        }
        .btn-default:hover {
          color: #ea0000 !important;
          background-color: #fff !important;
        }

        .thefticon, .narcoticsicon, .cattleicon {
          background-color: #f2f2f2;
          margin: 0px 20px;
          fill: #9b9b9b;
          padding-top: 12px;
        }
        .theftTitle, .theftDescp, .narcoticsTitle, .narcoticsDescp, .cattleTitle, .cattleDescp {
          background-color: #e8e8e8;
          margin: 0px 20px;
        }
        .theftDescp, .narcoticsDescp, .cattleDescp {
          padding-bottom: 10px !important;
          color: #5b5b5b;
          min-height: 110px;
          padding-left: 15px;
          padding-right: 15px;
        }
        .theftTitle, .narcoticsTitle, .cattleTitle {
          color: #ea0000;
          padding: 10px 0px;
          font-weight: bold;
        }

        #block-block-1 {
          background-color: #efefef;
          padding: 20px 0px;
          margin-top: 20px;
        }
        .publicServiceHeading {
          text-transform: uppercase;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .staffWelfareHeading, .serviceUnitsHeading, .Gallerytitle {
          font-size: 18px;
          color: #ea0000;
          font-weight: bold;
          margin-bottom: 15px;
        }
      `}</style>

      {/* Header / Navbar */}
      <header id="navbar" role="banner" className="navbar container navbar-default">
        <div className="container">
          <div className="navbar-header">
            <a className="logo navbar-btn pull-left" href="index.php" title="Home">
              <img src="images/logo.png" alt="Home" />
            </a>
            <button
              type="button"
              className="navbar-toggle"
              onClick={() => setNavCollapsed(!navCollapsed)}
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
          </div>
          <div className={`navbar-collapse ${navCollapsed ? 'collapse' : 'in'}`}>
            <nav role="navigation">
              <ul className="menu nav navbar-nav">
                <li className="first collapsed"><a href="#">About Us</a></li>
                <li className="collapsed"><a href="#">Crimes</a></li>
                <li className="collapsed"><a href="#">Public Service</a></li>
                <li className="collapsed"><a href="#">Info Desk</a></li>
                <li className="last collapsed"><a href="#">News & Events</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container container">
        <div className="row">
          {/* Banner 1 */}
          <div className="banner1 col-sm-12">
            <div className="region region-banner1">
              <section id="block-views-slider1-block" className="block block-views clearfix">
                <div className="view view-slider1 view-id-slider1 view-display-id-block">
                  <div className="view-content">
                    <div id="flexslider-1" className="flexslider" style={{ margin: '0 0 40px !important' }}>
                      <ul className="slides" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        <li>
                          <div className="views-field views-field-field-image1">
                            <div className="field-content">
                              <img typeof="foaf:Image" src="images/sgd.png" width="1170" height="350" alt="" style={{ maxWidth: '100%', height: 'auto' }} />
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Banner 2: Search + Table */}
          <div className="banner2 col-sm-12">
            <div className="region region-banner2">
              <section id="block-search-form" className="block block-search clearfix">
                <form className="form-search content-search" onSubmit={handleSubmit} id="search-block-form" style={{ width: '100%', float: 'none', margin: '0 auto' }}>
                  <div>
                    <div>
                      <h2 className="element-invisible" style={{ display: 'none' }}>Search form</h2>
                      <div className="input-group">
                        <input
                          title="Enter the terms you wish to search for."
                          placeholder="Search"
                          className="form-control form-text"
                          type="text"
                          id="edit-search-block-form--2"
                          name="search"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          size={15}
                          maxLength={128}
                        />
                        <span className="input-group-btn">
                          <button type="submit" name="sub" className="btn btn-default" style={{ padding: '6px 12px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                          </button>
                        </span>
                      </div>
                      <button className="element-invisible btn btn-primary form-submit" id="edit-submit" name="sub" value="Search" type="submit" style={{ display: 'none' }}>Search</button>
                    </div>
                  </div>
                </form>
              </section>

              {/* Table (shows only when a verification search is conducted) */}
              {hasSearched && (
                <>
                  <br /><br /><br />
                  {record ? (
                    <div className="sc_table" style={{ marginLeft: '20%', width: '60%' }}>
                      <table className="table table-bordered">
                        <tbody>
                          <tr style={{ textAlign: 'center' }}>
                            <td colSpan={2} style={{ background: '#dfe0df' }}>
                              <label>CNIC Number : </label> {record.cnic}
                            </td>
                          </tr>
                          <tr>
                            <td><label><b>Name:</b></label></td>
                            <td>{record.name}</td>
                          </tr>
                          <tr>
                            <td><label><b>Father/Husband Name:</b></label></td>
                            <td>{record.father_name}</td>
                          </tr>
                          <tr>
                            <td><label><b>License No:</b></label></td>
                            <td><b>{record.dl_no}</b></td>
                          </tr>
                          <tr></tr>
                          <tr>
                            <td><label><b> Current License Type:</b></label></td>
                            <td>{record.license_type}</td>
                          </tr>
                          <tr>
                            <td><label><b>Current License Issue Date:</b></label></td>
                            <td>{record.issue_date}</td>
                          </tr>
                          <tr>
                            <td><label><b>License Expiry Date:</b></label></td>
                            <td>{record.expiry_date}</td>
                          </tr>
                          <tr>
                            <td><label><b>License Issue District:</b></label></td>
                            <td>{record.district}</td>
                          </tr>
                          <tr>
                            <td><label><b>International Driving Permit:</b></label></td>
                            <td>{record.idp || 'Not Issued'}</td>
                          </tr>
                          <tr>
                            <td><label><b>Initial License Issue Type/Issue Date:</b></label></td>
                            <td>{record.initial_type_date}</td>
                          </tr>
                          <tr></tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="sc_table" style={{ marginLeft: '20%', width: '60%', textAlign: 'center', padding: '20px', background: '#fff', border: '1px solid #ddd' }}>
                      <h4 style={{ color: '#ea0000', fontWeight: 'bold' }}>No Record Found</h4>
                      <p style={{ color: '#555' }}>No driving license record exists for the provided search term.</p>
                    </div>
                  )}
                  <br /><br /><br />
                </>
              )}

              {/* News Block */}
              <section id="block-views-news-block" className="block block-views clearfix">
                <div className="view view-news view-id-news view-display-id-block">
                  <div className="view-content">
                    <div className="views-row views-row-1 views-row-odd views-row-first views-row-last">
                      <div className="views-field views-field-nothing">
                        <span className="field-content">
                          <div className="col-sm-12 row">
                            <div className=" newIcon"></div>
                            <div className=" newsDate"><span className="date-display-single">Jul 09, 2020</span></div>
                          </div>
                          <div className="col-sm-10 row newsTitle"><a href="#">ptpkp.gov.pk</a></div>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="more-link"> <a href="#">Read More </a></div>
                </div>
              </section>
            </div>
          </div>

          {/* Banner 3: Crimes */}
          <div className="banner3 col-sm-12">
            <div className="region region-banner3">
              <section id="block-block-2" className="block block-block clearfix">
                <div className="row">
                  <div className="col-sm-12 crimeWap">
                    {/* Vehicle Theft */}
                    <div className="theftWrap col-sm-4 rtecenter" style={{ textAlign: 'center' }}>
                      <div className="thefticon">
                        <a href="https://ptpkp-gov.net/vehicle_theft" target="_blank" rel="noopener noreferrer">
                          <img
                            src="/images/vehicle_theft.svg"
                            alt="Vehicle Theft"
                            width="93"
                            height="57"
                            style={{ display: 'inline-block', width: '93px', height: '57px' }}
                          />
                        </a>
                      </div>
                      <div className="theftTitle">
                        <a href="https://ptpkp-gov.net/vehicle_theft" target="_blank" rel="noopener noreferrer" style={{ color: '#ea0000' }}>
                          Vehicle Theft
                        </a>
                      </div>
                      <div className="theftDescp"> This cell of experts will be working with the local police to detect and impound the stolen/tampered vehicles in the region.</div>
                    </div>

                    {/* Narcotics */}
                    <div className="narcoticsWrap col-sm-4 rtecenter" style={{ textAlign: 'center' }}>
                      <div className="narcoticsicon">
                        <a href="https://ptpkp-gov.net/narcotics" target="_blank" rel="noopener noreferrer">
                          <img
                            src="/images/narcotics.svg"
                            alt="Narcotics"
                            width="93"
                            height="57"
                            style={{ display: 'inline-block', width: '93px', height: '57px' }}
                          />
                        </a>
                      </div>
                      <div className="narcoticsTitle">
                        <a href="https://ptpkp-gov.net/narcotics" target="_blank" rel="noopener noreferrer" style={{ color: '#ea0000' }}>
                          Narcotics
                        </a>
                      </div>
                      <div className="narcoticsDescp">Afghanistan is called the Golden Crescent in International Narcotics Trade. It is the largest producer of Narcotics like Opium, Heroin and Hashish (Charas).</div>
                    </div>

                    {/* Cattle Rustling */}
                    <div className="cattleWrap col-sm-4 rtecenter" style={{ textAlign: 'center' }}>
                      <div className="cattleicon">
                        <a href="https://ptpkp-gov.net/cattle_rustling" target="_blank" rel="noopener noreferrer">
                          <img
                            src="/images/cattle_rustling.svg"
                            alt="Cattle Rustling"
                            width="93"
                            height="57"
                            style={{ display: 'inline-block', width: '93px', height: '57px' }}
                          />
                        </a>
                      </div>
                      <div className="cattleTitle">
                        <a href="https://ptpkp-gov.net/cattle_rustling" target="_blank" rel="noopener noreferrer" style={{ color: '#ea0000' }}>
                          Cattle Rustling
                        </a>
                      </div>
                      <div className="cattleDescp">Traditionally, cattle rustling (theft) has been the main crime of the district. Previously, cattle rustlers were committing cattle theft by foot or by using horses.</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Public Services Block */}
              <section id="block-block-1" className="block block-block clearfix">
                <div className="publicServiceHeading col-sm-12 row rtecenter" style={{ textAlign: 'center' }}>public services</div>
                <div className="row rtecenter publicServiceWrap col-sm-12" style={{ textAlign: 'center' }}>
                  <div className="col-sm-6">
                    <div className="safetyWrap col-sm-6">
                      <div className="safetyicon"><img alt="" src="images/safety.png" style={{ height: 160, width: 175 }} /> </div>
                      <div className="safetyLink"><a href="#">Safety Tips</a></div>
                    </div>
                    <div className="rescueWrap col-sm-6">
                      <div className="rescueicon"><img alt="" src="images/rescue.png" style={{ height: 160, width: 175 }} /></div>
                      <div className="rescueLink"><a href="#">Rescue 15</a></div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="vehicleWrap col-sm-6">
                      <div className="vehicleicon"><img alt="" src="images/vehicle.png" style={{ height: 160, width: 175 }} /></div>
                      <div className="vehicleLink"><a href="#">Vehicle Verification</a></div>
                    </div>
                    <div className="reportWrap col-sm-6">
                      <div className="reporticon"><img alt="" src="images/report a crime.png" style={{ height: 160, width: 175 }} /></div>
                      <div className="reportLink"><a href="#">Report a Crime</a></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Top Section: Staff Welfare, Service Units, Gallery */}
        <div className="row topSection" style={{ marginTop: 20 }}>
          <div className="top_left col-sm-3">
            <div className="region region-top-left">
              <section id="block-block-3" className="block block-block clearfix">
                <div className="staffWelfareWrap">
                  <div className="staffWelfareHeading">Staff Welfare</div>
                  <div className="staffWelfareBullets">
                    <ul>
                      <li><a href="#">Facilities</a></li>
                      <li><a href="#">Trainings</a></li>
                      <li><a href="#">Appreciation Awards</a></li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="top_center col-sm-3">
            <div className="region region-top-center">
              <section id="block-block-4" className="block block-block clearfix">
                <div className="serviceUnitsWrap">
                  <div className="serviceUnitsHeading">Service Units</div>
                  <div className="serviceUnitsBullets">
                    <ul>
                      <li>Elite Police Force</li>
                      <li>Police Qaumi Razakars</li>
                      <li>Anti Car Lifting Cell</li>
                    </ul>
                  </div>
                  <div className="serviceUnitsMore rteright"><a href="#">View Details</a></div>
                </div>
              </section>
            </div>
          </div>

          <div className="top_right col-sm-6">
            <div className="region region-top-right">
              {/* Header with Title and Control Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <h2 className="Gallerytitle" style={{ margin: 0, padding: 0, fontSize: '18px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                  Gallery
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handlePrevGallery}
                    aria-label="Previous Images"
                    style={{
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      color: '#ea0000',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span>&lsaquo;</span> <span>PREV</span>
                  </button>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, padding: '0 2px' }}>
                    {galleryPairIdx + 1}/{totalPairs}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextGallery}
                    aria-label="Next Images"
                    style={{
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      color: '#ea0000',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span>NEXT</span> <span>&rsaquo;</span>
                  </button>
                </div>
              </div>

              {/* Carousel Container */}
              <section
                id="block-views-gallery-block"
                className="block block-views clearfix"
                onMouseEnter={() => setIsGalleryHovered(true)}
                onMouseLeave={() => setIsGalleryHovered(false)}
                style={{ position: 'relative' }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  {/* Left Side Arrow Button */}
                  <button
                    type="button"
                    onClick={handlePrevGallery}
                    aria-label="Previous Slide"
                    style={{
                      position: 'absolute',
                      left: '0px',
                      zIndex: 10,
                      background: '#ea0000',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      padding: 0,
                    }}
                  >
                    &#8249;
                  </button>

                  {/* 2-Image Array Slide */}
                  <div
                    className="row"
                    style={{
                      width: '100%',
                      margin: '0',
                      padding: '0 22px',
                      display: 'flex',
                      transition: 'opacity 0.25s ease',
                    }}
                  >
                    {GALLERY_ITEMS.slice(galleryPairIdx * 2, galleryPairIdx * 2 + 2).map((item, i) => (
                      <div key={`${galleryPairIdx}-${i}`} className="col-xs-6" style={{ padding: '0 4px', textAlign: 'center' }}>
                        <div
                          style={{
                            background: '#fff',
                            padding: '3px',
                            borderRadius: '3px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={item.src}
                            alt={item.alt}
                            style={{
                              width: '100%',
                              height: '75px',
                              objectFit: 'cover',
                              borderRadius: '2px',
                              display: 'block',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Side Arrow Button */}
                  <button
                    type="button"
                    onClick={handleNextGallery}
                    aria-label="Next Slide"
                    style={{
                      position: 'absolute',
                      right: '0px',
                      zIndex: 10,
                      background: '#ea0000',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      padding: 0,
                    }}
                  >
                    &#8250;
                  </button>
                </div>

                {/* Dot Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
                  {Array.from({ length: totalPairs }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGalleryPairIdx(idx)}
                      aria-label={`Go to pair ${idx + 1}`}
                      style={{
                        width: galleryPairIdx === idx ? '16px' : '7px',
                        height: '7px',
                        borderRadius: '4px',
                        border: 'none',
                        padding: 0,
                        background: galleryPairIdx === idx ? '#ea0000' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer container" style={{ marginTop: 30 }}>
        <div className="region region-footer">
          <section id="block-block-5" className="block block-block clearfix">
            <div className="col-sm-12 footermenu1">
              <div className="footermenu col-sm-10">
                <a href="#">Feedback</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <a href="#">Jobs</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <a href="#">Contact Us</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <a href="#">Sitemap</a>
              </div>
              <div className="col-sm-1" style={{ float: 'right', display: 'flex', gap: 6 }}>
                <a href="#"><img alt="" src="images/facebook.png" style={{ height: 46, width: 46 }} /></a>
                <a href="#"><img alt="" src="images/twitter.png" style={{ height: 46, width: 46 }} /></a>
              </div>
            </div>
            <div className="col-sm-12 copyPowered" style={{ marginTop: 15 }}>
              <div className="col-sm-6 copy1">© 2018 ptpkp.gov.pk</div>
              <div className="col-sm-6 powered1" style={{ textAlign: 'right' }}>Powered by: <a href="#">ptpkp.gov.pk</a></div>
            </div>
          </section>
        </div>
      </footer>
    </div>
  );
}
